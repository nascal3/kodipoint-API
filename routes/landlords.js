const express = require('express');
const router = express.Router();

const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const superUser = require('../middleware/suAuth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');
const landlordTenant = require('../middleware/landTenAuth');

require('express-async-errors');

// REGISTER LANDLORDS PERSONAL DETAILS
router.post('/register', [auth, superUser, admin, landlord, landlordTenant], async (req, res) => {

    let userID = req.user.id;
    let name = req.body.name;
    let email = req.body.email;
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



module.exports = router;
