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

// Function get single renting records of a tenant
const getSingleTenantRec = async (rec_id) => {
    return await TenantsProps.findAll({
        where: {
            id: rec_id
        }
    });
};

// GET SINGLE TENANTS' ALL RENTING INFO BY TENANT ID & DATE MOVED IN.
router.get('/single', [auth, admin, landlords, tenants], async (req, res) => {
    const tenant_id = req.body.tenant_id;

    const records = await TenantsProps.findAll({
        order: [
            ['move_in_date', 'DESC']
        ],
        where: {
            tenant_id: tenant_id
        }
    });

    res.status(200).json({'result': records});
});

// REGISTER TENANT TO MOVE INTO PROPERTY (add tenant to a newly rented property)
router.post('/movein', [auth, admin], async (req, res) => {

    const unitNumber = req.body.unit_no

    const duplicateEntry = await TenantsProps.findOne({
        where: {
            property_id: req.body.property_id,
            tenant_id: req.body.tenant_id,
            unit_no: unitNumber.toLowerCase(),
        }
    });

    if (duplicateEntry) return res.status(422).json({'Error': 'The entry has already been done!'});

    const userData = await TenantsProps.create({
        tenant_id: req.body.tenant_id,
        property_id: req.body.property_id,
        property_name: req.body.property_name,
        unit_no: unitNumber.toLowerCase(),
        unit_rent: req.body.unit_rent,
        landlord_id: req.body.landlord_id,
        landlord_name: req.body.landlord_name,
        move_in_date: req.body.move_in_date,
        created_by: req.user.id
    });

    res.status(200).json({'result': userData});
});

// EDIT TENANT RENTING DETAILS (also used for moving tenant out of rented property)
router.post('/edit', [auth, admin], async (req, res) => {

    const editedBy = req.user.id;
    const dbRecID = req.body.db_id;

    const userData = await TenantsProps.findOne({
        where: {
            id: dbRecID,
            tenant_id: res.body.tenant_id
        }
    });

    if (!userData) return res.status(500).json({'Error': 'Records not found'});

    const tenantID = userData.tenant_id;
    const propertyId = userData.property_id;
    const unitNo = userData.unit_no;
    const unitRent = userData.unit_rent;
    const landlordID = userData.landlord_id;
    const moveInDate = userData.move_in_date;
    const moveOutDate = userData.move_out_date;
    const phone = userData.phone;

    const newData = await TenantsProps.update({
            tenant_id: req.body.tenant_id || tenantID,
            property_id: req.body.property_id || propertyId,
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
              id: dbRecID,
              tenant_id: res.body.tenant_id
            }
        }
    );

   const changedData = await getSingleTenantRec(dbRecID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
