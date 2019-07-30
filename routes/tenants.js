const express = require('express');
const router = express.Router();

const Tenants = require('../models/tenantModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const tenant = require('../middleware/tenantAuth');

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
router.get('/:page', [auth, admin], async (req, res) => {
    let limit = 50;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await Tenants.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Tenants.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

// REGISTER TENANTS PERSONAL DETAILS
router.post('/register', [auth, tenant], async (req, res) => {

    let userID = req.user.id;
    let name = req.body.name;
    let email = req.user.email;
    let nationalID = req.body.national_id;
    let phone = req.body.phone;
    let avatar = req.body.avatar;

    const userData = await Tenants .create({
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
