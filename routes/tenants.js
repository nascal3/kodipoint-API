const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const Tenants = require('../models/tenantModel');
const TenantsProps = require('../models/tenantPropsModel');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenantAuth');
const landlord = require('../middleware/landlordAuth');

const users = require('./users');
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

// ***Function get single tenant records using their user_id***
const getTenant = async (user_id) => {
    return await Tenants.findOne({
        where: {
            user_id: user_id
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
    // get all tenant IDs still living in selected landlords' properties
    const tenantsIDs = await TenantsProps.findAll({
        attributes: [
            [sequelize.fn('DISTINCT', sequelize.col('tenant_id')), 'tenant_id']
        ],
        where: {
            landlord_id: landlordID,
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

// GET ONE TENANT BY USER ID
router.get('/single', [auth, tenant], async (req, res) => {
    const ID = req.body.user_id || req.user.id;
    const userData = await getTenant(ID);
    res.status(200).json({ 'results': userData});
});

// GET ALL TENANTS LIST
router.get('/all', [auth, landlord], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const tenants = await Tenants.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result':tenants});
});

// SEARCH FOR A TENANT
router.post('/search', [auth, landlord], async (req, res) => {
    const searchPhrase = req.body.search_phrase;
    const searchResults  = await searchTenant(searchPhrase)
    res.status(200).json({ 'result': searchResults});
});

// GET ALL TENANTS FOR SPECIFIC LANDLORD
router.get('/landlord', [auth, landlord], async (req, res) => {
    const limit= req.body.limit;
    const offset = req.body.offset;

    const userID = req.user.role === 'admin' ?  0 : req.user.id; // get user ID from token in header or request body
    const landlordID = await propertyFunctions.mapLandlordID(userID);

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
router.post('/landlord/search', [auth, landlord], async (req, res) => {
    const searchPhrase = req.body.search_phrase;

    const userID = req.user.role === 'admin' ? 0 : req.user.id; // get user ID from token in header or request body
    const landlordID = await propertyFunctions.mapLandlordID(userID);

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

//***Function look for duplicates of national ID***
 const duplicateID = async (info) => {
    const tenantsResults  = await Tenants.findAll({
        where: {
            [Op.or]: [
                { national_id: info.national_id }
            ],
            [Op.and]: {
                user_id: {
                    [Op.ne]: info.user_id
                }
            }
        }
    });
    return Object.keys(tenantsResults).length
};

// REGISTER TENANTS PERSONAL DETAILS
router.post('/register', [auth, tenant], async (req, res) => {

    const info = JSON.parse(req.body.data);
    const numberDuplicates = await duplicateID(info);
    if (numberDuplicates) return res.status(422).json({'Error': 'The following national ID already exists!'});

    const params = {
        'email':info.email,
        'password':'123456',
        'name':info.name,
        'role': 'tenant'
    };

    const createdUser = await users.createUser(params);
    if (!createdUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    const newUserID = createdUser.data.dataValues.id;
    const creatorID = req.user.id;

    let uploadPath = '';
    if (req.files) {
        uploadPath = await uploadImage(req.files, newUserID, 'user');
        if (!uploadPath) return res.status(500).json({'Error': 'File permissions error in server!'});
    }

    const userData = await users.createNewTenant(newUserID, info, uploadPath, creatorID);

    res.status(200).json({'result': userData});
});

// EDIT TENANTS PERSONAL DETAILS
router.post('/profile/edit', [auth, tenant], async (req, res) => {

    const info = JSON.parse(req.body.data);
    const userID = info.user_id || req.user.id;
    // const tenant_id = await mapTenantID(req.user.id)
    // const tenantID = req.body.tenant_id || tenant_id;

    const userData = await Tenants.findOne({
        where: {
            user_id: userID
        }
    });

    if (!userData) return res.status(404).json({'Error': 'Tenant not found'});

    if (info.national_id) {
        const numberIdDuplicates = await duplicateID(info);
        if (numberIdDuplicates) return res.status(422).json({'Error': 'The following national ID already exists!'});
    }

    const params = {
        'id': userID,
        'username':info.email || userData.email,
        'name':info.name
    };

    const editedUser = await users.editUser(params)
    if (!editedUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    const name = userData.name;
    const email = userData.email;
    const nationalID = userData.national_id;
    const phone = userData.phone;
    const avatar = userData.avatar;

    let uploadPath = '';
    if (req.files) {
        const deleted = await deleteFile(userID, 'user');
        if (!deleted) return;
        uploadPath = await uploadImage(req.files, userID, 'user');
        if (!uploadPath) return res.status(500).json({'Error': 'File permissions error in server!'});
    }

    const newData = await Tenants.update({
        name: info.name || name,
        email: info.email || email,
        national_id: info.national_id || nationalID,
        phone: info.phone || phone,
        avatar: uploadPath || avatar,
        updatedBy:  req.user.id
    },
        {
            where: {
                user_id: userID
            }
        }
    );

   const changedData = await getTenant(userID);

   res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
