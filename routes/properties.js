const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');

const Properties = require('../models/propertyModel');
const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

require('express-async-errors');
const Op = Sequelize.Op;

// ***Function get single property records***
const getProperty = async (prop_id) => {
    return await Properties.findOne({
        where: {
            id: prop_id
        }
    });
};

// ***Function get/match user ID to landlord ID***
const mapLandlordID = async (user_id) => {
    const results = await Landlords.findOne({
        where: {
            user_id: user_id
        }
    })
    return results.dataValues.id
};

// GET ONE PROPERTY BY ID.
router.get('/single', [auth, admin], async (req, res) => {
    const propData = await getProperty(req.body.id);
    res.status(200).json({ 'results': propData});
})

// SEARCH ALL PROPERTY .
router.post('/search', [auth, landlord], async (req, res) => {
  const property_name = req.body.property_name;

  const searchResults  = await Properties.findAll({
    where: {
      property_name: {
        [Op.like]: `%${property_name}%`
      }
    }
  });
  res.status(200).json({ 'results': searchResults});
})

// SEARCH PROPERTY FOR SINGLE LANDLORD BY ID.
router.post('/landlord/search', [auth, landlord], async (req, res) => {
  const property_name = req.body.property_name;
  const landlordID = await mapLandlordID(req.user.id); // get user ID from token in header

  const searchResults  = await Properties.findAll({
    where: {
      property_name: {
        [Op.like]: `%${property_name}%`
      },
      landlord_id: landlordID
    }
  });
  res.status(200).json({ 'results': searchResults});
})

// GET ALL PROPERTIES FOR SPECIFIC LANDLORD LIST .
router.get('/landlord/:page', [auth, landlord], async (req, res) => {
    const limit = 100;   // number of records per page
    let offset;
    const pageNumber = req.params.page;

    const landlordID = await mapLandlordID(req.user.id); // get user ID from token in header

    const data = await Properties.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;  // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const results = await Properties.findAll({
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
    const limit = 100;   // number of records per page
    let offset;
    const pageNumber = req.params.page;

    const data = await Properties.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    const pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Properties.findAll({
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

// REGISTER PROPERTY DETAILS
router.post('/register', [auth, landlord], async (req, res) => {
  const prop = JSON.parse(req.body.json)
  let uploadPath = '';
  if (req.files) {
    const propertyImage = req.files.file;
    const timeStamp = +new Date()
    uploadPath = `/uploads/images/${prop.user_id}/properties/${timeStamp}_${propertyImage.name}`;

    // Use the mv() method to place the file somewhere on your server
    propertyImage.mv(`./uploads/images/${prop.user_id}/properties/${timeStamp}_${propertyImage.name}`, (err) => {
      if (err) res.status(500).send(err);
    });
  }

  const landlord_id = await mapLandlordID(prop.user_id);
  const property_name = prop.property_name;
  const property_type = prop.property_type;
  const contact_person = prop.contact_person;
  const phone = prop.phone;
  const lr_nos = prop.lr_nos;
  const nos_units = prop.nos_units;
  const description = prop.description;
  const property_services = prop.property_services;
  const property_img = uploadPath

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
  const prop = JSON.parse(req.body.json)

  const propData = await Properties.findOne({
    where: {
        id: prop.id
    }
  });

  if (!propData) return res.status(500).json({'Error': 'Property not found'});

  const landlord_id = propData.landlord_id;
  const property_name = propData.property_name;
  const property_type = propData.property_type;
  const contact_person = propData.contact_person;
  const phone = propData.phone;
  const lr_nos = propData.lr_nos;
  const nos_units = propData.nos_units;
  const description = propData.description;
  const property_services = propData.property_services;
  const property_img = propData.property_img;

  const newData = await Properties.update({
    landlord_id: prop.landlord_id || landlord_id,
    property_name: prop.property_name || property_name,
    property_type: prop.property_type || property_type,
    contact_person: prop.contact_person || contact_person,
    phone: prop.phone || phone,
    lr_nos: prop.lr_nos || lr_nos,
    nos_units: prop.nos_units || nos_units,
    description: prop.description || description,
    property_services: prop.property_services || property_services,
    property_img: prop.property_img || property_img
  },
  {
    where: {
      id: prop.id
    }
  });

  const changedData = await getProperty(prop.id);

  res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = router;
