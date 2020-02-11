const express = require('express');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const router = express.Router();

const TenantsProps = require('../models/tenantPropsModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlords = require('../middleware/landlordAuth');
const tenants = require('../middleware/tenantAuth');

require('express-async-errors');

// Function get single tenants renting records
const getTenant = async (rec_id) => {
    return await TenantsProps.findAll({
        where: {
            id: rec_id
        }
    });
};

// GET ONE TENANT ALL RENTING INFO BY TENANT ID & DATE MOVED IN.
router.get('/single/:page', [auth, admin, landlords, tenants], async (req, res) => {

    let toDate =req.body.toDate;
    let fromDate = req.body.fromDate;
    const tenant_id = req.body.tenant_id;

    if (toDate === null || toDate === undefined) {
        toDate = new Date();
    }

    if (fromDate === null || fromDate === undefined) {
        let currentDate = new Date();
        fromDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    }

    let limit = 50;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await TenantsProps.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const records = await TenantsProps.findAll({
        order: [
            ['move_in_date', 'DESC']
        ],
        where: {
            tenant_id: tenant_id,
            move_in_date: {
                [Op.gte]: fromDate,
                [Op.lte]: toDate
            }
        },
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': records, 'currentPage': pageNumber, 'pages': pages});
});

// REGISTER TENANTS MOVED IN TO PROPERTY
router.post('/register', [auth, admin], async (req, res) => {

    let createdBy = req.user.id;

    let tenantID = req.body.tenant_id;
    let propertyId = req.body.property_id;
    let propertyName = req.body.property_name;
    let unitNo = req.body.unit_no;
    let unitRent = req.body.unit_rent;
    let landlordID = req.body.landlord_id;
    let moveInDate = req.body.move_in_date;
    let moveOutDate = req.body.move_out_date;
    let phone = req.body.phone;

    const userData = await TenantsProps .create({
        tenant_id: tenantID,
        property_id: propertyId,
        property_name: propertyName,
        unit_no: unitNo,
        unit_rent: unitRent,
        landlord_id: landlordID,
        move_in_date: moveInDate,
        move_out_date: moveOutDate,
        phone: phone,
        created_by: createdBy
    });

    res.status(200).json({'result': userData});
});

// EDIT TENANTS RENTING DETAILS
router.post('/edit', [auth, admin], async (req, res) => {

    let editedBy = req.user.id;
    let recID = req.body.id;

    const userData = await TenantsProps.findOne({
        where: {
            id: recID
        }
    });

    if (!userData) return res.status(500).json({'Error': 'Records not found'});

    let tenantID = userData.tenant_id;
    let propertyId = userData.property_id;
    let propertyName = userData.propertyName;
    let unitNo = userData.unit_no;
    let unitRent = userData.unit_rent;
    let landlordID = userData.landlord_id;
    let moveInDate = userData.move_in_date;
    let moveOutDate = userData.move_out_date;
    let phone = userData.phone;

    const newData = await TenantsProps.update({
            tenant_id: req.body.tenant_id || tenantID,
            property_id: req.body.property_id || propertyId,
            property_name: req.body.propertyName || propertyName,
            unit_no: req.body.unit_no || unitNo,
            unit_rent: req.body.unit_rent || unitRent,
            landlord_id: req.body.landlord_id || landlordID,
            move_in_date: req.body.move_in_date || moveInDate,
            move_out_date: req.body.move_out_date || moveOutDate,
            phone: req.body.phone || phone,
            edited_by: editedBy
    },
        {
            where: {
                id: recID
            }
        }
    );

   const changedData = await getTenant(recID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
