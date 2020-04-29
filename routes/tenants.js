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

const newUser = require('./users');
const editUser = require('./users');

const propertyFunctions = require('./properties');
const uploadImage = require('../helper/uploadFiles');
const deleteFile = require('../helper/deleteUploadedFiles');

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

// ***Function get single tenant records***
const getTenant = async (tenant_id) => {
    return await Tenants.findAll({
        where: {
            id: tenant_id
        }
    });
};

// ***Function search single tenant records***
const searchTenant = async (searchPhrase) => {
    return await Tenants.findAll({
        where: {
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${searchPhrase}%`
                    }
                },
                {
                    national_id: {
                        [Op.like]: `%${searchPhrase}%`
                    }
                }
            ]
        },
        raw: true
    });
};

// ***Function get all tenants of a specific landlord ***
const getLandlordTenants = async (landlordID) => {
    // get all property IDs belonging to selected landlord
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

    return tenantsIDsArray
};

// GET ONE TENANT BY ID
router.get('/single', [auth, tenant], async (req, res) => {
    const userData = await getTenant(req.body.tenant_id);
    res.status(200).json({ 'results': userData});
});

// GET ALL TENANTS LIST
router.get('/all', [auth, admin], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const tenants = await Tenants.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result':tenants});
});

// SEARCH FOR A TENANT
router.post('/search', [auth, admin], async (req, res) => {
    const searchPhrase = req.body.search_phrase;
    const searchResults  = await searchTenant(searchPhrase)
    res.status(200).json({ 'results': searchResults});
});

// GET ALL TENANTS FOR SPECIFIC LANDLORD
router.get('/landlord', [auth, landlord], async (req, res) => {
    const limit= req.body.limit;
    const offset = req.body.offset;

    const userID = req.user.role === 'admin' ? (req.body.user_id ? req.body.user_id : 0) : req.user.id;
    const landlordID = await propertyFunctions.mapLandlordID(userID); // get user ID from token in header or request body

    // get all tenant IDs still living in selected landlords' properties
    const tenantsIDsArray = await getLandlordTenants(landlordID)

    const tenants = await Tenants.findAll({
        where: {
            id: tenantsIDsArray
        },
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': tenants});
});

// SEARCH ALL TENANTS FOR SPECIFIC LANDLORD
router.get('/landlord/search', [auth, landlord], async (req, res) => {
    const searchPhrase = req.body.search_phrase;

    const userID = req.user.role === 'admin' ? (req.body.user_id ? req.body.user_id : 0) : req.user.id;
    const landlordID = await propertyFunctions.mapLandlordID(userID); // get user ID from token in header or request body

    // get all tenant IDs still living in selected landlords' properties
    const tenantsIDsArray = await getLandlordTenants(landlordID)

    const tenants = await Tenants.findAll({
        where: {
            id: tenantsIDsArray,
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${searchPhrase}%`
                    }
                },
                {
                    national_id: {
                        [Op.like]: `%${searchPhrase}%`
                    }
                }
            ]
        }
    });

    res.status(200).json({'result': tenants});
});

//***Function look for duplicates of KRA Pin or national ID***
 const duplicates = async (info) => {
    const tenantsResults  = await Tenants.findAll({
        where: {
            national_id: info.national_id
        }
    });
    return Object.keys(tenantsResults).length
};

// REGISTER TENANTS PERSONAL DETAILS
router.post('/register', [auth, tenant], async (req, res) => {

    const info = JSON.parse(req.body.json);
    const numberDuplicates = await duplicates(info);
    if (numberDuplicates) return res.status(422).json({'Error': 'The following national ID already exists!'});

    const params = {
        'username':info.email,
        'password':'123456',
        'name':info.name,
        'role': 'tenant'
    };

    const createdUser = await newUser.createNewUser(params);
    if (!createdUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});


    let uploadPath = '';
    if (req.files) uploadPath = uploadImage(req.files, info, 'user');

    const userData = await Tenants.create({
        user_id: createdUser.data.dataValues.id,
        name: info.name,
        email: info.email,
        national_id: info.national_id,
        phone: info.phone,
        updatedBy: req.user.id,
        avatar: uploadPath
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
