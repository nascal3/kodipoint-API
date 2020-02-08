const express = require('express');
const router = express.Router();

const Tenants = require('../models/tenantModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const tenant = require('../middleware/tenantAuth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');

// Function get single tenants records
const getTenant = async (user_id) => {
    return await Tenants.findAll({
        where: {
            user_id: user_id
        }
    });
};

// GET ONE TENANT BY ID.
router.get('/single', [auth, tenant], async (req, res) => {
    const userData = await getTenant(req.body.id);
    res.status(200).json({ 'results': userData});
})

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

// GET ALL TENANTS FOR SPECIFIC LANDLORD LIST .
router.post('/landlord', [auth, landlord], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const userID = req.user.role === 'admin' ? (req.body.user_id ? req.body.user_id : 0) : req.user.id;
    const landlordID = await mapLandlordID(userID); // get user ID from token in header or request body

    const tenants = await Tenants.findAll({
        where: {
            landlord_id: landlordID
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

    let userID = req.body.id || req.user.id;

    const userData = await Tenants.findOne({
        where: {
            user_id: userID
        }
    });

    if (!userData) return res.status(500).json({'Error': 'User not found'});

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
                user_id: userID
            }
        }
    );

   const changedData = await getTenant(userID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
