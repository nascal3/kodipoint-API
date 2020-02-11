const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const Tenants = require('../models/tenantModel');
const Properties = require('../models/propertyModel');
const TenantsProps = require('../models/tenantPropsModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const tenant = require('../middleware/tenantAuth');
const landlord = require('../middleware/landlordAuth');

const propertyFunctions = require('./properties');

require('express-async-errors');

// ***Function get/match user ID to tenant_ID***
const mapTenantID = async (user_id) => {
    const results = await Tenants.findOne({
        where: {
            user_id: user_id
        }
    })
    return results ? results.dataValues.id : 0
};

// ***Function get single tenants records***
const getTenant = async (tenant_id) => {
    return await Tenants.findAll({
        where: {
            id: tenant_id
        }
    });
};

// GET ONE TENANT BY ID.
router.get('/single', [auth, tenant], async (req, res) => {
    const userData = await getTenant(req.body.tenant_id);
    res.status(200).json({ 'results': userData});
});

// GET ALL TENANTS LIST .
router.get('/all', [auth, admin], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const tenants = await Tenants.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result':tenants});
});

// GET ALL TENANTS FOR SPECIFIC LANDLORD .
router.get('/landlord', [auth, landlord], async (req, res) => {
    const limit= req.body.limit;
    const offset = req.body.offset;

    const userID = req.user.role === 'admin' ? (req.body.user_id ? req.body.user_id : 0) : req.user.id;
    const landlordID = await propertyFunctions.mapLandlordID(userID); // get user ID from token in header or request body

    // get all property IDs belonging to selected landlords
    const propertyIDs = await Properties.findAll({
        attributes: ['id'],
        where: {
            landlord_id: landlordID
        },
        raw: true
    });
    let propertyIdArray = [];
    propertyIDs.forEach(value => {
        propertyIdArray.push(value.id)
    });

    // get all tenant IDs still living in selected landlords' properties
    const tenantsIDs = await TenantsProps.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('tenant_id')), 'tenant_id']
        ],
        where: {
            property_id: propertyIdArray,
            move_out_date: {
                [Op.is]: null,
            }
        },
        raw: true
    });
    let tenantsIDsArray = [];
    tenantsIDs.forEach(value => {
        tenantsIDsArray.push(value.tenant_id)
    });

    const tenants = await Tenants.findAll({
        where: {
            id: tenantsIDsArray
        },
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': tenants});
});

// REGISTER TENANTS PERSONAL DETAILS
router.post('/register', [auth, tenant], async (req, res) => {

    let userID = req.body.user_id || req.user.id;
    let name = req.body.name;
    let email = req.user.email;
    let nationalID = req.body.national_id;
    let phone = req.body.phone;
    let avatar = req.body.avatar;

    const userData = await Tenants.create({
        user_id: userID,
        name: name,
        email: email,
        national_id: nationalID,
        phone: phone,
        avatar: avatar
    });

    res.status(200).json({'result': userData});
});

// EDIT TENANTS PERSONAL DETAILS
router.post('/profile/edit', [auth, tenant], async (req, res) => {

    const tenant_id = await mapTenantID(req.user.id)
    const tenantID = req.body.tenant_id || tenant_id;

    const userData = await Tenants.findOne({
        where: {
            id: tenantID
        }
    });

    if (!userData) return res.status(500).json({'Error': 'Tenant not found'});

    let name = userData.name;
    let email = userData.email;
    let nationalID = userData.national_id;
    let phone = userData.phone;
    let avatar = userData.avatar;

    const newData = await Tenants.update({
        name: req.body.name || name,
        email: req.body.email || email,
        national_id: req.body.national_id || nationalID,
        phone: req.body.phone || phone,
        avatar: req.body.avatar || avatar
    },
        {
            where: {
                id: tenantID
            }
        }
    );

   const changedData = await getTenant(tenantID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
