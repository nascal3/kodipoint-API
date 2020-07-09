const express = require('express');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const router = express.Router();

const TenantsProps = require('../models/tenantPropsModel');
const auth = require('../middleware/auth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');

// Function get single renting records of a tenant
const getSingleTenantRec = async (rec_id) => {
    return await TenantsProps.findAll({
        where: {
            id: rec_id
        }
    });
};

// GET SINGLE TENANTS' ALL RENTING INFO BY TENANT ID.
router.post('/single', [auth], async (req, res) => {
    const tenant_id = req.body.tenant_id;
    const landlord_id  = req.body.landlord_id || 0;

    let records = null;
    const userRole = req.user.role;

    if (userRole === 'admin' || userRole === 'superU' || userRole === 'tenant') {
        records = await TenantsProps.findAll({
            order: [
                ['move_in_date', 'DESC']
            ],
            where: {
                tenant_id: tenant_id
            }
        });
    } else if (userRole === 'landlord' || userRole === 'landlordTenant') {
        records = await TenantsProps.findAll({
            order: [
                ['move_in_date', 'DESC']
            ],
            where: {
                tenant_id: tenant_id,
                landlord_id: landlord_id
            }
        });
    }

    res.status(200).json({'result': records});
});

// GET TENANT SINGLE RENTING RECORD
router.get('/row', [auth, landlord], async (req, res) => {
    const recordData = await TenantsProps.findOne({
        where: {
            id: req.query.record_id
        }
    });

    res.status(200).json({ 'results': recordData });
});

//**function check duplication move in entry**
const duplicateMoveInEntry = async (propertyId, tenantId, unitNumber) => {
    return await TenantsProps.findOne({
        where: {
            property_id: propertyId,
            tenant_id: tenantId,
            unit_no: unitNumber.toLowerCase()
        }
    });
}

// REGISTER TENANT TO MOVE INTO PROPERTY (add tenant to a newly rented property)
router.post('/movein', [auth, landlord], async (req, res) => {

    const unitNumber = req.body.unit_no

    const duplicateEntry = await duplicateMoveInEntry(req.body.property_id, req.body.tenant_id, unitNumber)
    if (duplicateEntry) return res.status(422).json({'Error': 'The entry has already been done!'});

    const propertyNotVacant = await TenantsProps.findOne({
        where: {
            property_id: req.body.property_id,
            unit_no: unitNumber.toLowerCase(),
            move_out_date: null
        }
    });
    if (propertyNotVacant) return res.status(422).json({'Error': 'This property is not vacant!'});

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

//**function check duplication move in entry on edit**
const duplicateMoveInEntryEdit = async (id, propertyId, tenantId, unitNumber) => {
    return await TenantsProps.findOne({
        where: {
            property_id: propertyId,
            tenant_id: tenantId,
            unit_no: unitNumber.toLowerCase(),
            [Op.and]: {
                id: {
                    [Op.ne]: id
                }
            }
        }
    });
}

//**function check if property being moved into is not vacant on edit**
const propertyNotVacantEdit = async (id, propertyId, unitNumber) => {
    return await TenantsProps.findOne({
        where: {
            property_id: propertyId,
            unit_no: unitNumber.toLowerCase(),
            move_out_date: null,
            [Op.and]: {
                id: {
                    [Op.ne]: id
                }
            }
        }
    });
}

// EDIT TENANT RENTING DETAILS (also used for moving tenant out of rented property)
router.post('/edit', [auth, landlord], async (req, res) => {

    const editedBy = req.user.id;
    const dbRecID = req.body.rec_id;

    const userData = await TenantsProps.findOne({
        where: {
            id: dbRecID
        }
    });

    if (!userData) return res.status(500).json({'Error': 'Records not found'});

    const tenantID = userData.tenant_id;
    const propertyId = userData.property_id;
    const unitNo = userData.unit_no;
    const unitRent = userData.unit_rent;
    const landlordID = userData.landlord_id;
    const landlordName = userData.landlord_name;
    const moveInDate = userData.move_in_date;
    const moveOutDate = userData.move_out_date;

    const duplicateEntry = await duplicateMoveInEntryEdit(dbRecID, req.body.property_id, req.body.tenant_id, req.body.unit_no)
    if (duplicateEntry) return res.status(422).json({'Error': 'The entry has already been done!'});

    const propertyNotVacant = await  propertyNotVacantEdit(dbRecID, req.body.property_id, req.body.unit_no)
    if (propertyNotVacant) return res.status(422).json({'Error': 'This property is not vacant!'});

    const newData = await TenantsProps.update({
            tenant_id: req.body.tenant_id || tenantID,
            property_id: req.body.property_id || propertyId,
            unit_no: req.body.unit_no || unitNo,
            unit_rent: req.body.unit_rent || unitRent,
            landlord_id: req.body.landlord_id || landlordID,
            landlord_name: req.body.landlord_name || landlordName,
            move_in_date: req.body.move_in_date || moveInDate,
            move_out_date: req.body.move_out_date || moveOutDate,
            edited_by: editedBy
    },
        {
            where: {
              id: dbRecID
            }
        }
    );

   const changedData = await getSingleTenantRec(dbRecID);

   res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
