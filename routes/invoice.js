require('dotenv').config();
const express = require('express');
const router = express.Router();
const url = require('url');
const http = require('http');
const { format, parseISO, sub } = require('date-fns');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const auth = require('../middleware/auth');
const landlord = require('../middleware/landlordAuth');
const tenant = require('../middleware/tenantAuth');

const Invoices = require('../models/invoiceModel');
const InvBreaks = require('../models/invbreakModel');
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
            [Sequelize.fn('MAX', Sequelize.col('id')), 'lastInvoice']
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

// GET SPECIFIC TENANT INVOICES (filtered by date issued)
router.post('/tenant/all', [auth, tenant], async (req, res) => {

    const tenantID = req.body.tenant_id;
    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    const invoices = await Invoices.findAll({
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
    const amountPaid = !req.body.amount_paid ? 0 : req.body.amount_paid;
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

    const invoice = await Invoices.findOne({
        where: {
            id: req.params.invoice_id
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
    return format(date, 'MMM, Do yyyy')
};

//***date and year format for SMS messages***
const smsDateYearFormat = (date) => {
    if (!date) return
    return format(parseISO(date), 'MMM, yyyy')
};

//***format invoice SMS message***
const smsInvoiceMessage = (data) => {
    return `Dear ${data.name}, your rent invoice for ${data.property_name}, Unit no: ${data.unit_no}, 
    ${smsDateYearFormat(data.rent_period)}. Rent: Ksh${data.rent_amount}, Balance Brought Forward: Ksh${data.amount_bf}, 
    Service Total: Ksh${data.services_amount}, Amount Paid: Ksh${data.amount_paid}, 
    Amount Due: Ksh${data.amount_balance}. Due Date:${smsDateMonthFormat(data.date_due)}.`;
}

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

    // add tenant data to invoice template
    const options = {
        port: process.env.PORT,
        path: `/docs/invoice`,
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
        console.error('problem with request: ' + err.message);
    });
    request.end();

    // generate invoice PDF
    const link = url.format({
        protocol: req.protocol,
        // host: req.get('host'),
        host: `localhost:${process.env.PORT}`,
        pathname: '/docs/invoice'
    });
    const invoicePDF = await documents.generateInvoicePDF(link);

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

module.exports = router;
