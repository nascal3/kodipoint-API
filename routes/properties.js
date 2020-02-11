const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Properties = require('../models/propertyModel');
const Landlords = require('../models/landlordModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

const uploadImage = require('../helper/uploadFiles')
const deleteFile = require('../helper/deleteUploadedFiles')
require('express-async-errors');

// ***Function get single property records***
const getProperty = async (prop_id) => {
    return await Properties.findOne({
        where: {
            id: prop_id
        }
    });
};

// ***Function get/match user ID to landlord_ID***
const mapLandlordID = async (user_id) => {
    const results = await Landlords.findOne({
        where: {
            user_id: user_id
        }
    });
    return results ? results.dataValues.landlord_id : 0;
};

// GET ONE PROPERTY BY ID.
router.get('/single', [auth, admin], async (req, res) => {
    const propData = await getProperty(req.body.id);
    res.status(200).json({ 'results': propData});
});

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
});

// SEARCH PROPERTY FOR SINGLE LANDLORD BY USER_ID.
router.post('/landlord/search', [auth, landlord], async (req, res) => {
  const property_name = req.body.property_name;
  const userId = req.body.user_id ? req.body.user_id : req.user.id;
  const landlordID = await mapLandlordID( userId); // get user ID from token in header or request body

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
router.post('/landlord', [auth, landlord], async (req, res) => {
  const limit= req.body.limit;   // number of records per page
  const offset = req.body.offset;

  const userID = req.user.role === 'admin' ? (req.body.user_id ? req.body.user_id : 0) : req.user.id;
  const landlordID = await mapLandlordID(userID); // get user ID from token in header or request body

  const results = await Properties.findAll({
      where: {
          landlord_id: landlordID
      },
      limit: limit,
      offset: offset
  });

  res.status(200).json({'result': results});
});

// GET ALL PROPERTIES LIST .
router.get('/all', [auth, admin], async (req, res) => {
  const limit= req.body.limit;   // number of records per page
  const offset = req.body.offset;

  const properties = await Properties.findAll({
      limit: limit,
      offset: offset
  });

  res.status(200).json({'result': properties});
});

// REGISTER PROPERTY DETAILS
router.post('/register', [auth, landlord], async (req, res) => {
  const prop = JSON.parse(req.body.json);
  let uploadPath = '';
  if (req.files) uploadPath = uploadImage(req.files, prop, 'property');

  const landlord_id = await mapLandlordID(prop.user_id);
  if (!landlord_id) return res.status(422).json({'result': 'A landlord user is missing'});

  const propData = await Properties .create({
    landlord_id: landlord_id,
    property_name: prop.property_name,
    property_type: prop.property_type,
    contact_person: prop.contact_person,
    phone: prop.phone,
    lr_nos: prop.lr_nos,
    nos_units: prop.nos_units,
    description: prop.description,
    property_services: prop.property_services,
    property_img: uploadPath,
    updatedBy: req.user.id
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

  if (!propData) return res.status(404).json({'Error': 'Property not found'});

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

  let uploadPath = ''
  if (req.files) {
    deleteFile(`.${property_img}`);
    uploadPath = uploadImage(req.files, prop, 'property');
  }

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
    property_img: uploadPath || property_img,
    updatedBy: req.user.id
  },
  {
    where: {
      id: prop.id
    }
  });

  const changedData = await getProperty(prop.id);

  res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

module.exports = {
  router: router,
  mapLandlordID: mapLandlordID,
};
