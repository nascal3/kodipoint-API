const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');


const newUser = require('./users');
const editUser = require('./users');

const uploadImage = require('../helper/uploadFiles');
const deleteFile = require('../helper/deleteUploadedFiles');
require('express-async-errors');

// ***Function get single landlord data using user_ID***
const getLandlord = async (user_id) => {
    return await Landlords.findOne({
        where: {
            user_id: user_id
        }
    });
};

// GET ONE LANDLORD BY ID.
router.get('/single', [auth, landlord], async (req, res) => {
    const ID = req.body.id || req.user.id;
    const userData = await getLandlord(ID);
    res.status(200).json({ 'results': userData});
});

// SEARCH ALL LANDLORDS.
router.post('/search', [auth, landlord], async (req, res) => {
    const searchPhrase = req.body.search_phrase;

    const searchResults  = await Landlords.findAll({
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
        }
    });
    res.status(200).json({ 'results': searchResults});
});

// GET ALL LANDLORDS LIST .
router.get('/all', [auth, admin], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const landlords = await Landlords.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': landlords});
});

//***Function look for duplicates of KRA Pin or national ID***
const duplicates = async (info) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            [Op.or]: [
                { kra_pin: info.kra_pin },
                { national_id: info.national_id }
            ]
        }
    });
    return Object.keys(landlordsResults).length
};

//***Function look for duplicates of KRA Pin or national ID with current
// user ID exception***
const duplicatesExcept = async (info) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            [Op.or]: [
                { kra_pin: info.kra_pin },
                { national_id: info.national_id }
            ],
            [Op.and]: {
                user_id: {
                    [Op.ne]: info.user_id
                }
            }
        }
    });
    return Object.keys(landlordsResults).length
};

// REGISTER LANDLORDS PERSONAL DETAILS
router.post('/register', [auth, landlord], async (req, res) => {

    const info = JSON.parse(req.body.json);
    const numberDuplicates = await duplicates(info);
    if (numberDuplicates) return res.status(422).json({'Error': 'The following KRA Pin/national ID already exists!'});

    const params = {
        'username':info.email,
        'password':'123456',
        'name':info.name,
        'role':info.role
    };

    const createdUser = await newUser.createNewUser(params);
    if (!createdUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    let uploadPath = '';
    if (req.files) uploadPath = uploadImage(req.files, info, 'user');

    const userData = await Landlords.create({
        user_id: createdUser.data.dataValues.id,
        name: info.name,
        email: info.email,
        national_id: info.national_id,
        kra_pin: info.kra_pin,
        phone: info.phone,
        bank_name: info.bank_name,
        bank_branch: info.bank_branch,
        bank_acc: info.bank_acc,
        bank_swift: info.bank_swift,
        bank_currency: info.bank_currency,
        updatedBy: req.user.id,
        avatar: uploadPath
    });

    res.status(200).json({'result': userData});
});

// EDIT LANDLORDS PERSONAL DETAILS
router.post('/profile/edit', [auth, landlord], async (req, res) => {

    const info = JSON.parse(req.body.json);
    const userID = req.user.role === 'admin' ? info.user_id : req.user.id;

    const userData = await Landlords.findOne({
        where: {
            user_id: userID
        }
    });

    if (!userData) return res.status(404).json({'Error': 'User not found'});

    const numberDuplicates = await duplicatesExcept(info)
    if (numberDuplicates) return res.status(422).json({'Error': 'The following KRA Pin/national ID already exists!'});

    const params = {
        'id': userID,
        'username':info.email,
        'name':info.name,
        'role':info.role
    };
    const editedUser = await editUser.editUser(params)
    if (!editedUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    const name = userData.name;
    const email = userData.email;
    const nationalID = userData.national_id;
    const kraPIN = userData.kra_pin;
    const phone = userData.phone;
    const bankName = userData.bank_name;
    const bankBranch = userData.bank_branch;
    const bankACC = userData.bank_acc;
    const bankSwift = userData.bank_swift;
    const bank_currency = userData.bank_currency;
    const avatar = userData.avatar;

    let uploadPath = ''
    if (req.files) {
        deleteFile(`.${avatar}`);
        uploadPath = uploadImage(req.files, info, 'user');
    }

    const newData = await Landlords.update({
        name: info.name || name,
        email: info.email || email,
        national_id: info.national_id || nationalID,
        kra_pin: info.kra_pin || kraPIN,
        phone: info.phone || phone,
        bank_name: info.bank_name || bankName,
        bank_branch: info.bank_branch || bankBranch,
        bank_acc: info.bank_acc || bankACC,
        bank_swift: info.bank_swift || bankSwift,
        bank_currency: info.bank_currency || bank_currency,
        avatar: uploadPath || avatar,
        updatedBy:  req.user.id
    },{
        where: {
            user_id: userID
        }
    });

   const changedData = await getLandlord(userID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});


module.exports = router;
