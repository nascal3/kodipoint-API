const express = require('express');
const router = express.Router();
const { sub } = require('date-fns');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

const Invoices = require('../models/invoiceModel');
const InvBreaks = require('../models/invbreakModel');
const TenantProps = require('../models/tenantPropsModel');


// GET SPECIFIC TENANT INVOICES (filtered by date issued)
router.post('/tenant/all', [auth, admin], async (req, res) => {

    const tenantID = req.body.tenant_id
    const propertyID = req.body.property_id

    const dateFrom = req.body.date_from || new Date()
    const dateTo = req.body.date_to || sub(new Date(), { months: 2 })

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
router.post('/landlord/all', [auth, admin], async (req, res) => {

    const landlordID = req.body.landlord_id;
    const property = 'all' || req.body.property_id;

    const dateFrom = req.body.date_from || new Date();
    const dateTo = req.body.date_to || sub(new Date(), { months: 2 });

    const limit= req.body.limit;
    const offset = req.body.offset;

    const invoices = property === 'all'
        ? await landlordInvoices(landlordID, dateFrom, dateTo, limit, offset)
        : await landlordPropertyInvoices(landlordID, property, dateFrom, dateTo, limit, offset);

    res.status(200).json({ 'results': invoices});
});

//***find rent amount of tenants' unit***
const rentAmount = async (tenantID, propertyID, unitNo) => {
    return await TenantProps.findOne({
        attributes: ['unit_rent'],
        where: {
            tenant_id: tenantID,
            property_id: propertyID,
            unit_no: unitNo
        }
    })
};

// CREATE TENANT INVOICES
router.post('/create', [auth, admin], async (req, res) => {

    const tenantID = req.body.tenant_id;
    const landlordID = req.body.landlord_id;
    const propertyID = req.body.property_id;
    const propertyName = req.body.property_name;
    const unitNo = req.body.unit_no;
    const loggedUser = req.user.id;

    const unitRent = await rentAmount(tenantID, propertyID, unitNo);

    const invoices = await Invoices.create({
        tenant_id: tenantID,
        landlord_id: landlordID,
        property_id: propertyID,
        property_name: propertyName,
        unit_no: unitNo,
        date_issued: new Date(),
        createdBy: loggedUser
    });

    res.status(200).json({ 'results': invoices});
});

module.exports = router;
