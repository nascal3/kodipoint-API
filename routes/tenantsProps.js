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

    let to_date =req.body.to_date;
    let from_date = req.body.from_date;
    const tenant_id = req.body.tenant_id;

    if (!to_date) {
        to_date = new Date();
    }

    if (!from_date) {
        const currentDate = new Date();
        from_date = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    }

    const limit= req.body.limit; // number of records per page
    const offset = req.body.offset;

    const records = await TenantsProps.findAll({
        order: [
            ['move_in_date', 'DESC']
        ],
        where: {
            tenant_id: tenant_id,
            move_in_date: {
                [Op.gte]: from_date,
                [Op.lte]: to_date
            }
        },
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': records});
});

// REGISTER TENANTS MOVED IN TO PROPERTY
router.post('/register', [auth, admin], async (req, res) => {

    const userData = await TenantsProps .create({
        tenant_id: req.body.tenant_id,
        property_id: req.body.property_id,
        property_name: req.body.property_name,
        unit_no: req.body.unit_no,
        unit_rent: req.body.unit_rent,
        landlord_id: req.body.landlord_id,
        move_in_date: req.body.move_in_date,
        move_out_date: req.body.move_out_date,
        phone: req.body.phone,
        created_by: req.user.id
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
