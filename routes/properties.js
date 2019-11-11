const express = require('express');
const router = express.Router();

const Properties = require('../models/propertyModel');
const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');

// Function get single property records
const getProperty = async (prop_id) => {
    return await Properties.findOne({
        where: {
            id: prop_id
        }
    });
};

// Function get/match user ID to landlord ID
const mapLandlordID = async (user_id) => {
    return Landlords.findOne({
        where: {
            user_id: user_id
        },
        attributes: ['id']
    })
};

// GET ONE PROPERTY BY ID.
router.get('/single', [auth, admin], async (req, res) => {
    const propData = await getProperty(req.body.id);
    res.status(200).json({ 'results': propData});
})

// GET ALL PROPERTIES FOR SPECIFIC LANDLORD LIST .
router.get('/landlord/:page', [auth, landlord], async (req, res) => {
    let limit = 100;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const landlordData = await mapLandlordID(req.user.id); // get user ID from token in header
    const landlordID = landlordData.dataValues.id

    // let landlordID = req.params.landlord_id;

    const data = await Properties.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;  // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const results = await Properties.findOne({
        where: {
            landlord_id: landlordID
        },
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': results, 'currentPage': pageNumber, 'pages': pages});
});

// GET ALL PROPERTIES LIST .
router.get('/:page', [auth, admin], async (req, res) => {
    let limit = 100;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await Properties.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Properties.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

// REGISTER PROPERTY DETAILS
router.post('/register', [auth, landlord], async (req, res) => {

    let landlord_id = req.body.landlord_id;
    let property_name = req.body.property_name;
    let property_type = req.body.property_type;
    let contact_person = req.body.contact_person;
    let phone = req.body.phone;
    let lr_nos = req.body.lr_nos;
    let nos_units = req.body.nos_units;
    let description = req.body.description;
    let property_services = req.body.property_services;
    let property_img = req.body.property_img;

    const propData = await Properties .create({
        landlord_id: landlord_id,
        property_name: property_name,
        property_type: property_type,
        contact_person: contact_person,
        phone: phone,
        lr_nos: lr_nos,
        nos_units: nos_units,
        description: description,
        property_services: property_services,
        property_img: property_img
    });

    res.status(200).json({'result': propData});
});

// EDIT PROPERTY DETAILS
router.post('/edit', [auth, landlord], async (req, res) => {

    const propData = await Properties.findOne({
        where: {
            id: req.body.id
        }
    });

    if (!propData) return res.status(500).json({'Error': 'Property not found'});

    let landlord_id = propData.landlord_id;
    let property_name = propData.property_name;
    let property_type = propData.property_type;
    let contact_person = propData.contact_person;
    let phone = propData.phone;
    let lr_nos = propData.lr_nos;
    let nos_units = propData.nos_units;
    let description = propData.description;
    let property_services = propData.property_services;
    let property_img = propData.property_img;

    const newData = await Properties.update({
            landlord_id: req.body.landlord_id || landlord_id,
            property_name: req.body.property_name || property_name,
            property_type: req.body.property_type || property_type,
            contact_person: req.body.contact_person || contact_person,
            phone: req.body.phone || phone,
            lr_nos: req.body.lr_nos || lr_nos,
            nos_units: req.body.nos_units || nos_units,
            description: req.body.description || description,
            property_services: req.body.property_services || property_services,
            property_img: req.body.property_img || property_img
    },
        {
            where: {
                id: req.body.id
            }
        }
    );

   const changedData = await getProperty(req.body.id);

    res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
