const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

const users = require('./users');
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

// ***Function get single landlord data using landlord_ID***
const getLandlordByID = async (landlord_id) => {
    return await Landlords.findOne({
        where: {
           landlord_id: landlord_id
        }
    });
};

// GET ONE LANDLORD BY USER_ID
router.get('/single', [auth, landlord], async (req, res) => {
    const ID = req.body.id || req.user.id;
    const userData = await getLandlord(ID);
    res.status(200).json({ 'results': userData});
});

// SEARCH FOR A LANDLORD
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

// GET ALL LANDLORDS LIST
router.get('/all', [auth, admin], async (req, res) => {
    const limit= req.body.limit;   // number of records per page
    const offset = req.body.offset;

    const landlords = await Landlords.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': landlords});
});

//***Function look for duplicates of KRA Pin or national ID on whole landlord table ***
// user ID exception***
const duplicateID = async (info) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            national_id: info.national_id
        }
    });
    return Object.keys(landlordsResults).length
};
// user KRA PIN exception***
const duplicateKRApin = async (info) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            kra_pin: info.kra_pin
        }
    });
    return Object.keys(landlordsResults).length
};

// REGISTER LANDLORDS PERSONAL DETAILS
router.post('/register', [auth, landlord], async (req, res) => {

    const info = JSON.parse(req.body.data);
    const IdNumberDuplicates = await duplicateID(info);
    if (IdNumberDuplicates) return res.status(422).json({'Error': 'The following national ID already exists!'});

    const kraPinNumberDuplicates = await duplicateKRApin(info);
    if (kraPinNumberDuplicates) return res.status(422).json({'Error': 'The following KRA Pin already exists!'});

    const params = {
        'email':info.email,
        'password':'123456',
        'name':info.name,
        'role':info.role
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

    const userData = await users.createNewLandlord(newUserID, info, uploadPath, creatorID);

    res.status(200).json({'result': userData});
});

//***Function look for duplicates of KRA Pin or national ID for editing except on currently selected landlord
// user ID exception***
const duplicatesIDExcept = async (info, userID) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            national_id: info.national_id ,
            [Op.and]: {
                user_id: {
                    [Op.ne]: userID
                }
            }
        }
    });
    return Object.keys(landlordsResults).length
};
// user KRA PIN exception***
const duplicatesKRAExcept = async (info, userID) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            kra_pin: info.kra_pin,
            [Op.and]: {
                user_id: {
                    [Op.ne]: userID
                }
            }
        }
    });
    return Object.keys(landlordsResults).length
};
// user email exception***
const duplicateEmail = async (info, userID) => {
    const landlordsResults  = await Landlords.findAll({
        where: {
            kra_pin: info.email,
            [Op.and]: {
                user_id: {
                    [Op.ne]: userID
                }
            }
        }
    });
    return Object.keys(landlordsResults).length
};

// EDIT LANDLORDS PERSONAL DETAILS
router.post('/profile/edit', [auth, landlord], async (req, res) => {

    const info = JSON.parse(req.body.data);
    const userID = req.user.role === 'admin' || req.user.role === 'superU' ? info.user_id : req.user.id;

    const userData = await Landlords.findOne({
        where: {
            user_id: userID
        }
    });

    if (!userData) return res.status(404).json({'Error': 'User not found'});

    const idNumberDuplicates = await duplicatesIDExcept(info, userID);
    if (idNumberDuplicates) return res.status(422).json({'Error': 'The following national ID already exists!'});

    const KRAnumberDuplicates = await duplicatesKRAExcept(info, userID);
    if (KRAnumberDuplicates) return res.status(422).json({'Error': 'The following KRA Pin already exists!'});

    const emailDuplicates = await duplicateEmail(info, userID);
    if (emailDuplicates) return res.status(422).json({'Error': 'The following email already exists!'});

    const params = {
        'id': userID,
        'username':info.email || userData.email,
        'name':info.name,
        'role':info.role
    };
    const editedUser = await users.editUser(params);
    if (!editedUser) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    const name = userData.name;
    const email = userData.email;
    const nationalID = userData.national_id;
    const kraPIN = userData.kra_pin;
    const phone = userData.phone;
    const postal_address = userData.postal_address;
    const bankName = userData.bank_name;
    const bankBranch = userData.bank_branch;
    const bankACC = userData.bank_acc;
    const bankSwift = userData.bank_swift;
    const bank_currency = userData.bank_currency;
    const avatar = userData.avatar;

    let uploadPath = '';
    if (req.files) {
        const deleted = await deleteFile(avatar);
        if (!deleted) return;
        uploadPath = await uploadImage(req.files, userID, 'user');
        if (!uploadPath) return res.status(500).json({'Error': 'File permissions error in server!'});
    }

    const newData = await Landlords.update({
        name: info.name || name,
        email: info.email || email,
        national_id: info.national_id || nationalID,
        kra_pin: info.kra_pin || kraPIN,
        phone: info.phone || phone,
        postal_address: info.postal_address || postal_address,
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

// APPROVE LANDLORD
router.post('/profile/approve', [auth, admin], async (req, res) => {

    const landlordID = req.body.landlord_id

    const newData = await Landlords.update({
        approved: req.body.approval,
        approvedBy:  req.user.id
    },{
        where: {
            landlord_id: landlordID
        }
    });

    const changedData = await getLandlordByID(landlordID);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});


module.exports = router;
