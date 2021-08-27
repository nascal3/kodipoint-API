require('dotenv').config();
const express = require('express');
const router = express.Router();
const url = require('url');
const http = require('http');
const { format, parseISO, sub } = require('date-fns');

const sequelize = require('sequelize');
const Op = sequelize.Op;

const auth = require('../middleware/auth');
const landlord = require('../middleware/landlordAuth');
const tenant = require('../middleware/tenantAuth');

const Invoices = require('../models/invoiceModel');
const InvBreaks = require('../models/invbreakModel');
const Receipts = require('../models/receiptModel');
const Tenants = require('../models/tenantModel');
const TenantProps = require('../models/tenantPropsModel');
const Services = require('../models/serviceModel');
const Landlords = require('../models/landlordModel');
const Properties = require('../models/propertyModel');
const documents = require('../routes/documents');
const sendEmail = require('../helper/sendEmail');
const sendSMS = require('../helper/sendSMS');
require('express-async-errors');

//***find balance brought forward in latest invoice***
const getInvoiceBF = async (tenantID, propertyID) => {
    const { lastInvoice } = await Invoices.findOne({
        attributes: [
            [sequelize.fn('MAX', sequelize.col('id')), 'lastInvoice']
        ],
        where: {
            tenant_id: tenantID,
            property_id: propertyID,
        },
        raw: true
    });
    if (!lastInvoice) return 0;

    const { amount_bf } = await Invoices.findOne({
        attributes: ['amount_bf'],
        where: {
            id: lastInvoice
        },
        raw: true
    });
    return amount_bf || 0;
}

// GET SPECIFIC TENANT INVOICE BALANCE CARRIED FORWARD
router.get('/bcf', [auth, tenant], async (req, res) => {
    const tenantID = req.query.tenant_id
    const propertyID = req.query.property_id
    const balanceCarriedForward = await getInvoiceBF(tenantID, propertyID)

    res.status(200).json({ 'results': balanceCarriedForward});
});

//***fetch a tenants personal details***
const tenantDetails = async (tenantID) => {
    return await Tenants.findOne({
        attributes: ['name', 'email', 'phone'],
        where: {
            id: tenantID
        },
        raw: true
    });
}

//***map user ID to landlord ID***
const mapLandlordID = async (userID) => {
    return await Landlords.findOne({
        attributes: ['landlord_id'],
        where: {
            user_id: userID
        },
        raw: true
    });
};

// GET SPECIFIC TENANT INVOICES (filtered by date issued)
router.post('/tenant/all', [auth, tenant], async (req, res) => {

    const tenantID = req.body.tenant_id;
    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    let invoices = null;
    const userRole = req.user.role;
    let landlordID = null;
    if (userRole === 'landlord' || userRole === 'landlordTenant') {
        const { landlord_id } = await mapLandlordID(req.user.id);
        landlordID = landlord_id
    }

    if (userRole === 'admin' || userRole === 'superU' || userRole === 'tenant') {
        invoices = await Invoices.findAll({
            order: [
                ['rent_period', 'DESC']
            ],
            where: {
                tenant_id: tenantID,
                rent_period: {
                    [Op.between]: [dateFrom, dateTo]
                }
            },
            include: [
                {
                    model: InvBreaks,
                    as: 'invoice_breakdowns',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                }
            ]
        });
    } else if (userRole === 'landlord' || userRole === 'landlordTenant') {
        invoices = await Invoices.findAll({
            order: [
                ['rent_period', 'DESC']
            ],
            where: {
                tenant_id: tenantID,
                landlord_id: landlordID,
                rent_period: {
                    [Op.between]: [dateFrom, dateTo]
                }
            },
            include: [
                {
                    model: InvBreaks,
                    as: 'invoice_breakdowns',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                }
            ]
        });
    }

    res.status(200).json({ 'results': invoices});
});

//***find all invoices created by landlord for specific property***
const landlordPropertyInvoices = async (landlordID, propertyID, dateFrom, dateTo) => {
    return await Invoices.findAll({
        order: [
            ['rent_period', 'DESC']
        ],
        where: {
            landlord_id: landlordID,
            property_id: propertyID,
            rent_period: {
                [Op.between]: [dateFrom, dateTo]
            }
        },
        include: [
            {
                model: InvBreaks,
                as: 'invoice_breakdowns',
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
        ]
    });
};

//***find all invoices created by landlord***
const landlordInvoices = async (landlordID, dateFrom, dateTo) => {
    return await Invoices.findAll({
        order: [
            ['rent_period', 'DESC']
        ],
        where: {
            landlord_id: landlordID,
            rent_period: {
                [Op.between]: [dateFrom, dateTo]
            }
        },
        include: [
            {
                model: InvBreaks,
                as: 'invoice_breakdowns',
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
        ]
    });
};

// GET INVOICES CREATED BY LANDLORD (filtered by date issued)
router.post('/landlord/all', [auth, landlord], async (req, res) => {

    const landlordID = req.body.landlord_id;
    const property = 'all' || req.body.property_id;

    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    const invoices = property === 'all'
        ? await landlordInvoices(landlordID, dateFrom, dateTo)
        : await landlordPropertyInvoices(landlordID, property, dateFrom, dateTo);

    res.status(200).json({ 'results': invoices});
});

//***find services belonging to a tenants' property unit***
const tenantPropertyServices = async (propertyID) => {
    return await Services.findAll({
        attributes: ['service_name', 'service_price'],
        where: {
            property_id: propertyID
        },
        raw: true
    });
};

//***find if duplicate invoice service breakdown already exists***
const checkInvoiceServiceDuplicate = async (invoiceID, service) => {
    return await InvBreaks.findOne({
        where: {
            invoice_id: invoiceID,
            service_name: service.service_name
        },
        raw: true
    })
}

//***add services belonging to a tenants' property unit to invoice breakdown***
const addInvoiceServiceBreakdown = async (invoiceID, service) => {
    const duplicateService = await checkInvoiceServiceDuplicate(invoiceID, service);
    if (!duplicateService) {
        return await InvBreaks.create({
            invoice_id: invoiceID,
            service_name: service.service_name,
            service_price: service.service_price
        });
    }
};

//***remove services belonging to a tenants' property unit in invoice breakdown***
const removeInvoiceServiceBreakdown = async (invoiceID, service) => {
    return await InvBreaks.destroy({
        where: {
            invoice_id: invoiceID,
            service_name: service.service_name,
        }
    });
};

//***find rent amount of tenants' unit***
const rentAmount = async (tenantID, propertyID, unitNo) => {
    return await TenantProps.findOne({
        attributes: ['unit_rent'],
        where: {
            tenant_id: tenantID,
            property_id: propertyID,
            unit_no: unitNo
        },
        raw: true
    })
};

//***fetch property name and landlord ID of tenants' unit***
const propertyInfo = async (propertyID) => {
    return await Properties.findOne({
        attributes: ['landlord_id', 'property_name'],
        where: {
            id: propertyID
        },
        raw: true
    })
};

//***find if duplicate invoice already exists***
const checkDuplicateInvoice = async (tenantID, propertyID, unitNo, rentPeriod) => {
    return await Invoices.findOne({
        where: {
            tenant_id: tenantID,
            property_id: propertyID,
            unit_no: unitNo,
            rent_period: rentPeriod
        },
        raw: true
    })
}

// CREATE TENANT INVOICES
router.post('/create', [auth, landlord], async (req, res) => {
    const propertyDetails = await propertyInfo(req.body.property_id);

    const tenantID = req.body.tenant_id;
    const landlordID = propertyDetails.landlord_id;
    const propertyID = req.body.property_id;
    const propertyName = propertyDetails.property_name;
    const unitNo = req.body.unit_no;
    const rentPeriod = req.body.rent_period;
    const dateDue = req.body.date_due;
    const amountPaid =  req.body.amount_paid || 0;
    const amountBroughtForward = req.body.amount_bf;
    const loggedUser = req.user.id;

    const duplicateInvoice = await checkDuplicateInvoice(tenantID, propertyID, unitNo, rentPeriod);
    if (duplicateInvoice) return res.status(422).json({'Error': 'The following invoice already exists!'});

    let servicesTotal = 0;
    const propertyServices = await tenantPropertyServices(propertyID);
    if (propertyServices.length) {
        propertyServices.forEach( tenantService => {
            servicesTotal+=tenantService.service_price
        })
    }

    const rentInfo = await rentAmount(tenantID, propertyID, unitNo);
    if (!rentInfo) return res.status(404).json({'Error': 'The following tenant records do not exist!'});
    const amountBalance = (rentInfo.unit_rent + servicesTotal + amountBroughtForward) - amountPaid;

    const invoice = await Invoices.create({
        tenant_id: tenantID,
        landlord_id: landlordID,
        property_id: propertyID,
        property_name: propertyName,
        unit_no: unitNo,
        rent_period: rentPeriod,
        date_due: dateDue,
        rent_amount: rentInfo.unit_rent,
        services_amount: servicesTotal,
        amount_owed: rentInfo.unit_rent + servicesTotal + amountBroughtForward,
        amount_paid: amountPaid,
        amount_bf: amountBroughtForward,
        amount_balance: amountBalance,
        createdBy: loggedUser
    });

    if (propertyServices.length) {
        await Promise.all(propertyServices.map( async (service) => {
            await addInvoiceServiceBreakdown(invoice.id, service)
        }))
    }

    res.status(200).json({ 'results': invoice});
});

//***fetch all services breakdown belonging to an invoice***
const invoiceBreakdownServices = async (propertyID) => {
    const services = await InvBreaks.findAll({
        where: {
            invoice_id: propertyID
        },
        raw: true
    });

    let servicesTotal = 0;
    if (services.length) {
        services.forEach( service => {
            servicesTotal+=service.service_price
        })
    }
    return servicesTotal;
};

//***fetch latest invoice of a property***
const latestInvoice = async (propertyId, unitNo) => {
    return await Invoices.findOne({
        attributes: [[sequelize.fn('MAX', sequelize.col('id')), 'id']],
        where: {
            property_id: propertyId,
            unit_no: unitNo
        },
        raw: true
    });
}

//***fetch an invoice by ID (invoice num)***
const fetchInvoice = async (invoiceID) => {
    return await Invoices.findOne({
        where: {
            id: invoiceID
        },
        include: [
            {
                model: InvBreaks,
                as: 'invoice_breakdowns',
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
        ]
    });
};

// EDIT INVOICE BREAKDOWN SERVICES
router.post('/edit/service', [auth, landlord], async (req, res) => {

    const invoiceID = req.body.invoice_id;
    const serviceName = req.body.service_name;
    const servicePrice = req.body.service_price;
    const operation = req.body.operation;
    const loggedUser = req.user.id;

    const invoice = await Invoices.findOne({
        where: {
            id: invoiceID
        },
        raw: true
    });
    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});

    const service = {
        'service_name': serviceName,
        'service_price': servicePrice
    }

    let newService = null;
    if (operation === 'add') {
        newService = await addInvoiceServiceBreakdown(invoice.id, service)
        if (!newService) return res.status(422).json({'Error': 'The following service already exists!'});
    } else if ( operation === 'remove') {
        newService = await removeInvoiceServiceBreakdown(invoice.id, service)
    } else {
        return res.status(422).json({'Error': 'Please use value "add" or "remove" for the operation option!'});
    }

    const servicesTotal = await invoiceBreakdownServices(invoice.id);
    const amountBalance = (invoice.rent_amount + servicesTotal + invoice.amount_bf) - invoice.amount_paid;

    await Invoices.update({
        services_amount: servicesTotal,
        amount_balance: amountBalance,
        amount_owed: invoice.rent_amount + servicesTotal + invoice.amount_bf,
        updatedBy: loggedUser
    },{
        where: {
            id: invoice.id
        }
    });

    res.status(200).json({ 'results': newService});
});

// FETCH SINGLE INVOICE DETAILS
router.get('/single/:invoice_id', [auth, tenant], async (req, res) => {

    const invoice = await fetchInvoice(req.params.invoice_id);
    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});

    const tenantInfo = await tenantDetails(invoice.tenant_id);

    const invoiceData = {...tenantInfo, ...invoice.dataValues};

    res.status(200).json({ 'results': invoiceData });
});

//***find landlord email address***
const landlordInfo = async (landlordID) => {
    return await Landlords.findOne({
        attributes: ['name', 'email'],
        where: {
            landlord_id: landlordID
        },
        raw: true
    });
};

//***date and month format for SMS messages***
const smsDateMonthFormat = (date) => {
    if (!date) return
    return format(date, 'MMM, do yyyy')
};

//***date and year format for SMS messages***
const smsDateYearFormat = (date) => {
    if (!date) return
    return format(parseISO(date), 'MMM, yyyy')
};

//***format invoice SMS message***
const smsInvoiceMessage = (data) => {
  const {
      name,
      property_name,
      unit_no,
      rent_period,
      id,
      rent_amount,
      amount_bf,
      services_amount,
      amount_paid,
      amount_balance,
      date_due
  } = data;
  return `Dear ${name}, your rent invoice for ${property_name.toUpperCase()}, Unit no: ${unit_no.toUpperCase()}, ${smsDateYearFormat(rent_period)}.\nInvoice no: #${id}. Rent: Ksh${rent_amount}, Balance Brought Forward: Ksh${amount_bf}, Service Total: Ksh${services_amount}, Amount Paid: Ksh${amount_paid}, Amount Due: Ksh${amount_balance}. Due Date:${smsDateMonthFormat(date_due)}.`;
};

//***format receipt SMS message***
const smsReceiptMessage = (data) => {
    const {
        name,
        property_name,
        unit_no,
        rent_period,
        receipt_num,
        paid,
        amount_balance,
        rent_amount,
        services_amount,
        updatedAt
    } = data;
    return `Dear ${name}, your payment for ${property_name.toUpperCase()}, Unit no: ${unit_no.toUpperCase()}, ${smsDateYearFormat(rent_period)}.\nReceipt no: #${receipt_num}. Amount Paid: Ksh${paid}, Balance Brought Forward: Ksh${amount_balance}, Rent Amount: Ksh${rent_amount}, Service Total: Ksh${services_amount}. Pay Date:${smsDateMonthFormat(updatedAt)}.`;
};

//***visit document page to place data in template***
const visitTemplatePage = (req, path) => {
    const options = {
        port: process.env.PORT,
        path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*"
        }
    };
    const request = http.request( options, (res) => {
        res.setEncoding('utf8');
        console.log('>>> status code:', res.statusCode);
    });
    request.on('error', (err) => {
        console.error(`problem with request: ${err.message}`);
    });
    request.end();

    // generate invoice PDF
    const urlLink = new URL ('http://localhost');
    urlLink.protocol = req.protocol;
    urlLink.port = process.env.PORT;
    urlLink.pathname = path;

    return urlLink.href;
};

// GENERATE INVOICE PDF & SEND TO TENANT
router.post('/send', [auth, landlord], async (req, res) => {
    const invoiceNumber = req.body.invoice_number;

    const invoice = await Invoices.findOne({
        where: {
            id: invoiceNumber
        },
        include: [
            {
                model: InvBreaks,
                as: 'invoice_breakdowns',
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
        ]
    });

    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});
    const tenantInfo = await tenantDetails(invoice.tenant_id);

    // add date issued/send date if not added yet
    if (!invoice.date_issued) {
        await Invoices.update({
            date_issued: new Date()
        },{
            where: {
                id: invoiceNumber
            }
        });
    }

    const invoiceData = {...tenantInfo, ...invoice.dataValues};
    documents.setInvoiceData(JSON.stringify(invoiceData))

    const path = `/docs/invoice`;
    const url = visitTemplatePage(req, path);

    const invoicePDF = await documents.generatePDF(url, 'invoice');

    const [areaCode, phoneNum] = tenantInfo.phone.split(' ');
    const tenantPhoneNumber = `${areaCode}${phoneNum}`;
    const smsMessage = smsInvoiceMessage(invoiceData);

    const { email } = await landlordInfo(invoice.landlord_id);

    const smsResponse = await sendSMS(tenantPhoneNumber, smsMessage);
    const emailResponse = await sendEmail(
        tenantInfo.email,
        email,
        'Tenant rental invoice.',
        `Dear ${tenantInfo.name}, here is your rental invoice.`,
        'Rent Invoice.pdf',
        invoicePDF
    );

    res.status(200).json({ 'results': {...smsResponse, ...emailResponse} });
});

// RESET INVOICE DATE ISSUED DATE
router.post('/reset/dateIssued', [auth, landlord], async (req, res) => {
    const invoiceNumber = req.body.invoice_number;

    const response = await Invoices.update({
        date_issued: null
    },{
        where: {
            id: invoiceNumber
        }
    });

    res.status(200).json({ 'results': response });
});

//***update invoice with receipt payment***
const updateInvoice = async (invoice, receipt, loggedUser) => {

    const { id } = invoice;
    const { paid, already_paid, amount_balance } = receipt;
    const totalPaid = paid + already_paid;

    const paid_status = amount_balance <= 0 ? 'full' : 'partial';
    console.log(totalPaid, amount_balance, paid_status);

    await Invoices.update({
        amount_paid: totalPaid,
        amount_balance,
        paid_status,
        updatedBy: loggedUser
    }, {
        where: {
            id: id
        }
    });
};

//***create receipt***
const createReceipt = async (invoice, payData, newAmountBalance, loggedUser) => {

    const {
        id,
        property_id,
        tenant_id,
        unit_no,
        property_name,
        rent_period,
        rent_amount,
        services_amount,
        amount_bf,
        amount_paid,
        amount_balance
    } = invoice;
    const { payment_method, paid } = payData;

    return await Receipts.create({
        invoice_id: id,
        property_id,
        tenant_id,
        property_name,
        unit_no,
        rent_period,
        rent_amount,
        services_amount,
        amount_bf,
        already_paid: amount_paid,
        amount_owed: amount_balance,
        paid,
        payment_method,
        amount_balance: newAmountBalance,
        date_issued: new Date(),
        createdBy: loggedUser
    });
};

//***generate receipt PDF***
const generateReceiptPDF = async (req, receiptData, invoiceData) => {

    const { tenant_id, id } = receiptData;
    const tenantInfo =  await tenantDetails(tenant_id);

    const receiptInfo = {receipt_num: id, ...tenantInfo, ...receiptData, ...invoiceData};
    delete receiptInfo.date_issued;
    delete receiptInfo.amount_paid;
    delete receiptInfo.createdAt;
    delete receiptInfo.id;

    documents.setReceiptData(JSON.stringify(receiptInfo));

    const path = `/docs/receipt`;
    const url = visitTemplatePage(req, path);

    const receiptPDF = await documents.generatePDF(url, 'receipt');
    const { phone, name } = tenantInfo;

    const [areaCode, phoneNum] = phone.split(' ');
    const tenantPhoneNumber = `${areaCode}${phoneNum}`;
    const smsMessage = smsReceiptMessage(receiptData);

    const { email } = await landlordInfo(invoiceData.landlord_id);

    const smsResponse = await sendSMS(tenantPhoneNumber, smsMessage);
    const emailResponse = await sendEmail(
        tenantInfo.email,
        email,
        'Tenant rent payment receipt.',
        `Dear ${name}, here is your rent payment receipt.`,
        'Rent receipt.pdf',
        receiptPDF
    );

    return { emailResponse, smsResponse };
};

// PAY FOR AN INVOICE
router.post('/pay', [auth, landlord], async (req, res) => {

    const amountPaid = req.body.amount_paid || 0;
    const propertyId = req.body.property_id;
    const unitNo = req.body.unit_no;
    const paymentMethod = req.body.payment_method;
    const loggedUser = req.user.id;

    if (!parseInt(amountPaid)) return res.status(400).json({'Error': 'Please insert a figure larger that zero!'});

    const invoiceResults = await latestInvoice(propertyId, unitNo);
    const invoiceId = invoiceResults.id;

    const invoice = await fetchInvoice(invoiceId);
    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});

    const { amount_balance } = invoice.dataValues;
    const newAmountBalance = amount_balance - amountPaid;
    const payData = { paid: amountPaid, payment_method: paymentMethod }

    const receipt = await createReceipt(invoice, payData, newAmountBalance, loggedUser);
    await updateInvoice(invoice, receipt, loggedUser);

    const messageResponses = await generateReceiptPDF(req, receipt.dataValues, invoice.dataValues);
    const { emailResponse, smsResponse } = messageResponses;

    res.status(201).json({data: receipt, email_response: emailResponse, sms_response: smsResponse});
});

//***fetch receipt by ID(num)***
const getReceipt = async (receiptNum) => {
    return await Receipts.findOne({
        where: {
            id: receiptNum
        }, raw: true
    });
};

// GENERATE RECEIPT PDF & SEND TO TENANT
router.post('/receipt/send', [auth, landlord], async (req, res) => {
    const receiptNum = parseInt(req.body.receipt_num);

    const receipt = await getReceipt(receiptNum);
    if (!receipt) return res.status(404).json({'Error': 'The following receipt does not exist!'});

    const { invoice_id } = receipt;
    const invoice = await fetchInvoice(invoice_id);
    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});

    const messageResponses = await generateReceiptPDF(req, receipt, invoice.dataValues);
    const { emailResponse, smsResponse } = messageResponses;

    res.status(200).json({data: receipt, email_response: emailResponse, sms_response: smsResponse});
});

// FETCH SINGLE RECEIPT DETAILS
router.get('/receipt/:receipt_num', [auth, tenant], async (req, res) => {
    const receiptNum = req.params.receipt_num;

    const receipt = await getReceipt(parseInt(receiptNum));
    if (!receipt) return res.status(404).json({'Error': 'The following receipt does not exist!'});

    const { invoice_id, tenant_id, id } = receipt;
    const tenantInfo =  await tenantDetails(tenant_id);
    const invoice = await fetchInvoice(invoice_id);
    if (!invoice) return res.status(404).json({'Error': 'The following invoice does not exist!'});

    const receiptInfo = { receipt_num: id, ...tenantInfo, ...receipt, ...invoice.dataValues };
    delete receiptInfo.date_issued;
    delete receiptInfo.amount_paid;
    delete receiptInfo.createdAt;
    delete receiptInfo.id;

    res.status(200).json({ results: receiptInfo });
});

// GET SPECIFIC TENANT RECEIPTS (filtered by date issued)
router.post('/receipt/tenant/all', [auth, tenant], async (req, res) => {

    const tenantID = req.body.tenant_id;
    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    let receipts = null;
    const userRole = req.user.role;
    let landlordID = null;
    if (userRole === 'landlord' || userRole === 'landlordTenant') {
        const { landlord_id } = await mapLandlordID(req.user.id);
        landlordID = landlord_id
    }

    if (userRole === 'admin' || userRole === 'superU' || userRole === 'tenant') {
        receipts = await Receipts.findAll({
            order: [
                ['date_issued', 'DESC']
            ],
            where: {
                tenant_id: tenantID,
                rent_period: {
                    [Op.between]: [dateFrom, dateTo]
                }
            }
        });
    } else if (userRole === 'landlord' || userRole === 'landlordTenant') {
        receipts = await Receipts.findAll({
            order: [
                ['date_issued', 'DESC']
            ],
            where: {
                tenant_id: tenantID,
                landlord_id: landlordID,
                rent_period: {
                    [Op.between]: [dateFrom, dateTo]
                }
            }
        });
    }

    res.status(200).json({ results: receipts});
});


module.exports = router;
