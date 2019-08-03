const express = require('express');
const router = express.Router();

const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');

// Function get single landlord data
const getLandlord = async (user_id) => {
    return await Landlords.findOne({
        where: {
            user_id: user_id
        }
    });
};

// GET ONE LANDLORD BY ID.
router.get('/single', [auth, landlord], async (req, res) => {
    const userData = await getLandlord(req.body.id);
    res.status(200).json({ 'results': userData});
});

// GET ALL LANDLORDS LIST .
router.get('/:page', [auth, admin], async (req, res) => {
    let limit = 50;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await Landlords.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Landlords.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

// REGISTER LANDLORDS PERSONAL DETAILS
router.post('/register', [auth, landlord], async (req, res) => {

    let userID = req.body.user_id || req.user.id;
    let name = req.body.name;
    let email = req.user.email;
    let nationalID = req.body.national_id;
    let kraPIN = req.body.kra_pin;
    let phone = req.body.phone;
    let bankName = req.body.bank_name;
    let bankBranch = req.body.bank_branch;
    let bankACC = req.body.bank_acc;
    let bankSwift = req.body.bank_swift;
    let bank_currency = req.body.bank_currency;
    let avatar = req.body.avatar;

    const userData = await Landlords.create({
        user_id: userID,
        name: name,
        email: email,
        national_id: nationalID,
        kra_pin: kraPIN,
        phone: phone,
        bank_name: bankName,
        bank_branch: bankBranch,
        bank_acc: bankACC,
        bank_swift: bankSwift,
        bank_currency: bank_currency,
        avatar: avatar
    });

    res.status(200).json({'result': userData});
});

// EDIT LANDLORDS PERSONAL DETAILS
router.post('/profile/edit', [auth, landlord], async (req, res) => {

    let userID = req.body.id || req.user.id;

    const userData = await Landlords.findOne({
        where: {
            user_id: userID
        }
    });

    if (!userData) return res.status(500).json({'Error': 'User not found'});

    let name = userData.name;
    let email = userData.email;
    let nationalID = userData.national_id;
    let kraPIN = userData.kra_pin;
    let phone = userData.phone;
    let bankName = userData.bank_name;
    let bankBranch = userData.bank_branch;
    let bankACC = userData.bank_acc;
    let bankSwift = userData.bank_swift;
    let bank_currency = userData.bank_currency;
    let avatar = userData.avatar;

    const newData = await Landlords.update({
        name: req.body.name || name,
        email: req.body.email || email,
        national_id: req.body.national_id || nationalID,
        kra_pin: req.body.kra_pin || kraPIN,
        phone: req.body.phone || phone,
        bank_name: req.body.bank_name || bankName,
        bank_branch: req.body. bank_branch || bankBranch,
        bank_acc: req.body.bank_acc || bankACC,
        bank_swift: req.body.bank_swift || bankSwift,
        bank_currency: req.body.bank_currency || bank_currency,
        avatar: req.body.avatar || avatar
    },
        {
            where: {
                user_id: userID
            }
        }
    );

   const changedData = await getLandlord(userID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});


module.exports = router;
