const express = require('express');
const router = express.Router();
const http = require('http');
const { sub } = require('date-fns');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');
const tenant = require('../middleware/tenantAuth');

const Invoices = require('../models/invoiceModel');
const InvBreaks = require('../models/invbreakModel');
const Tenants = require('../models/tenantModel');
const TenantProps = require('../models/tenantPropsModel');
const Services = require('../models/serviceModel');
const Properties = require('../models/propertyModel');
const documents = require('../routes/documents')
require('express-async-errors');

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
    const propertyID = req.body.property_id;

    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    const limit= req.body.limit;
    const offset = req.body.offset;

    const invoices = await Invoices.findAll({
        order: [
            ['date_issued', 'DESC']
        ],
        where: {
            tenant_id: tenantID,
            property_id: propertyID,
            date_issued: {
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
        ],
        limit: limit,
        offset: offset
    });

    res.status(200).json({ 'results': invoices});
});

//***find all invoices created by landlord for specific property***
const landlordPropertyInvoices = async (landlordID, propertyID, dateFrom, dateTo, limit, offset) => {
    return await Invoices.findAll({
        order: [
            ['date_issued', 'DESC']
        ],
        where: {
            landlord_id: landlordID,
            property_id: propertyID,
            date_issued: {
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
        ],
        limit: limit,
        offset: offset
    });
};

//***find all invoices created by landlord***
const landlordInvoices = async (landlordID, dateFrom, dateTo, limit, offset) => {
    return await Invoices.findAll({
        order: [
            ['date_issued', 'DESC']
        ],
        where: {
            landlord_id: landlordID,
            date_issued: {
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
        ],
        limit: limit,
        offset: offset
    });
};

// GET INVOICES CREATED BY LANDLORD (filtered by date issued)
router.post('/landlord/all', [auth, landlord], async (req, res) => {

    const landlordID = req.body.landlord_id;
    const property = 'all' || req.body.property_id;

    const dateFrom = req.body.date_from || sub(new Date(), { months: 2 });
    const dateTo = req.body.date_to || new Date();

    const limit= req.body.limit;
    const offset = req.body.offset;

    const invoices = property === 'all'
        ? await landlordInvoices(landlordID, dateFrom, dateTo, limit, offset)
        : await landlordPropertyInvoices(landlordID, property, dateFrom, dateTo, limit, offset);

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

//***remove services belonging to a tenants' property unit to invoice breakdown***
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
    const amountBalance = (rentInfo.unit_rent + servicesTotal) - amountPaid;

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
        amount_owed: rentInfo.unit_rent + servicesTotal,
        amount_paid: amountPaid,
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
    const amountBalance = (invoice.rent_amount + servicesTotal) - invoice.amount_paid;

    await Invoices.update({
        services_amount: servicesTotal,
        amount_balance: amountBalance,
        amount_owed: invoice.rent_amount + servicesTotal,
        updatedBy: loggedUser
    },{
        where: {
            id: invoice.id
        }
    });

    res.status(200).json({ 'results': newService});
});

// ISSUE/SEND INVOICE TO TENANT
router.post('/send', [auth, landlord], async (req, res) => {
    const invoiceNumber = req.body.invoice_number;

    await Invoices.update({
      date_issued: new Date()
    },{
        where: {
            id: invoiceNumber
        }
    });

    const invoice = await Invoices.findOne({
        where: {
            id: req.body.invoice_number
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

    const tenantInfo = await tenantDetails(invoice.tenant_id);

    const invoiceData = {...tenantInfo, ...invoice.dataValues};
    documents.setInvoiceData(JSON.stringify(invoiceData))

    const options = {
        port: 3000,
        path: `/docs/invoice`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*"
        }
    };
    const request = http.request( options, (res) => {
        res.setEncoding('utf8');
        console.log('Status Code:', res.statusCode);
    });
    request.on('error', (err) => {
        console.error('problem with request: ' + err.message);
    });
    request.end();

    res.status(200).json({ 'results': invoiceData });
});

module.exports = router;
