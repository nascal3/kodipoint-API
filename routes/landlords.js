const express = require('express');
const router = express.Router();

const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');

// REGISTER LANDLORDS PERSONAL DETAILS
router.post('/register', [auth, landlord], async (req, res) => {

    let userID = req.user.id;
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



module.exports = router;
