const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Properties = require('../models/propertyModel');
const Landlords = require('../models/landlordModel');
const Services = require('../models/serviceModel');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');
const landlord = require('../middleware/landlordAuth');

const uploadImage = require('../helper/uploadFiles')
const deleteFile = require('../helper/deleteUploadedFiles')
require('express-async-errors');

//***Function look for duplicates of LR numbers***
const duplicateLR = async (info) => {
  return await Properties.findOne({
    where: {
      lr_nos: info.lr_nos
    }
  })
};

//***Function check edit LR number not duplicate***
const checkDuplicateLR = async (info) => {
  return await Properties.findAll({
    where: {
      lr_nos: info.lr_nos,
      [Op.and]: {
        id: {
          [Op.ne]: info.id
        }
      }
    }
  });
};

// ***Function get single property records***
const getProperty = async (prop_id) => {
    return await Properties.findOne({
        where: {
            id: prop_id
        },
        include: [
        {
          model: Services,
          as: 'services',
          attributes: {
            exclude: ['createdAt', 'updatedAt']
          }
        }
      ]
    });
};

// ***Function add single property services***
const addPropertyService = async (prop_id, prop_name, service_name) => {
  return await Services.create({
    property_id: prop_id,
    property_name: prop_name,
    service_name: service_name
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
router.post('/single', [auth, admin], async (req, res) => {
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

// GET ALL PROPERTIES FOR SPECIFIC LANDLORD .
router.post('/landlord', [auth, landlord], async (req, res) => {
  const limit= req.body.limit;   // number of records per page
  const offset = req.body.offset;

  let adminRole = false;
  if (req.user.role === 'admin' || req.user.role === 'superU') {
    adminRole = true;
  }

  const userID = adminRole ? req.body.user_id : req.user.id;
  const landlordID = await mapLandlordID(userID); // map user ID from token in header or request body to landlord ID

  const results = await Properties.findAll({
      where: {
          landlord_id: landlordID
      },
      include: [
      {
        model: Services,
        as: 'services',
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        }
      }
    ],
      limit: limit,
      offset: offset
  });

  res.status(200).json({'result': results});
});

// GET ALL PROPERTIES LIST .
router.post('/all', [auth, admin], async (req, res) => {
  const limit= req.body.limit;   // number of records per page
  const offset = req.body.offset;

  const properties = await Properties.findAll({
      include: [
      {
        model: Services,
        as: 'services',
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        }
      }
    ],
      limit: limit,
      offset: offset
  });

  res.status(200).json({'result': properties});
});

// ADD NEW PROPERTY DETAILS
router.post('/register', [auth, landlord], async (req, res) => {
  const prop = JSON.parse(req.body.data);

  const landlord_id = await mapLandlordID(prop.user_id);
  if (!landlord_id) return res.status(422).json({'result': 'A landlord user is missing'});

  const duplicateLRNumber = await duplicateLR(prop);
  if (duplicateLRNumber) return res.status(422).json({'Error': 'The following LR number is already registered!'});

  let uploadPath = '';
  if (req.files) {
    uploadPath = await uploadImage(req.files, prop.user_id, 'property');
    if (!uploadPath) return res.status(500).json({'Error': 'File permissions error in server!'});
  }

  const propData = await Properties.create({
    landlord_id: landlord_id,
    property_name: prop.property_name,
    property_type: prop.property_type,
    title_type: prop.title_type,
    ownership_type: prop.ownership_type,
    contact_person: prop.contact_person,
    contact_email: prop.contact_email,
    phone: prop.phone,
    lr_nos: prop.lr_nos,
    nos_units: prop.nos_units,
    description: prop.description,
    property_location: prop.property_location,
    property_coordinates: prop.property_coordinates,
    property_services: prop.property_services,
    property_img: uploadPath,
    approved: 0,
    updatedBy: req.user.id
  });

  if (prop.property_services) {
    const servicesArray = prop.property_services.split(',')
    await Promise.all(servicesArray.map( async (service) => {
      await addPropertyService(propData.id, prop.property_name, service)
    }))
  }

  res.status(200).json({'result': propData});
});

// EDIT PROPERTY DETAILS
router.post('/edit', [auth, landlord], async (req, res) => {
  const prop = JSON.parse(req.body.data)
  const propData = await Properties.findOne({
    where: {
      id: prop.id
    }
  });

  if (!propData) return res.status(404).json({'Error': 'Property not found'});

  const landlord_id = propData.landlord_id;
  const property_name = propData.property_name;
  const property_type = propData.property_type;
  const title_type = propData.title_type;
  const ownership_type = propData.ownership_type;
  const contact_person = propData.contact_person;
  const contact_email = propData.contact_email;
  const phone = propData.phone;
  const lr_nos = propData.lr_nos;
  const nos_units = propData.nos_units;
  const description = propData.description;
  const property_location = propData.property_location;
  const property_coordinates = propData.property_coordinates;
  const property_services = propData.property_services;
  const property_img = propData.property_img;

  const duplicateLRNumber = await checkDuplicateLR(propData);
  if (duplicateLRNumber.length > 0) return res.status(422).json({'Error': 'The following LR number is already registered!'});

  let uploadPath = '';
  if (req.files) {
    // const deleted = await deleteFile(prop.user_id, 'property');
    // if (!deleted) return;
    uploadPath = await uploadImage(req.files, prop.user_id, 'property');
    if (!uploadPath) return res.status(500).json({'Error': 'File permissions error in server!'});
  }

  const appendServices = (newServices) => {
    const newServicesArray = newServices.split(',')
    if (!newServicesArray.length) return null
    const currentServicesArray = property_services.split(',')
    const newArray = [...currentServicesArray, ...newServicesArray]
    let unique = [...new Set(newArray)];
    return  unique.join(',')
  }

  const newData = await Properties.update({
    landlord_id: prop.landlord_id || landlord_id,
    property_name: prop.property_name || property_name,
    property_type: prop.property_type || property_type,
    title_type: prop.title_type || title_type,
    ownership_type: prop.ownership_type || ownership_type,
    contact_person: prop.contact_person || contact_person,
    contact_email: prop.contact_email || contact_email,
    phone: prop.phone || phone,
    lr_nos: prop.lr_nos || lr_nos,
    nos_units: prop.nos_units || nos_units,
    description: prop.description || description,
    property_services: appendServices(prop.property_services) || property_services,
    property_img: uploadPath || property_img,
    property_location: prop.property_location || property_location,
    property_coordinates: prop.property_coordinates || property_coordinates,
    updatedBy: req.user.id
  },
  {
    where: {
      id: prop.id
    }
  });

  const changedData = await getProperty(prop.id);

  if (prop.property_services) {
    const newServicesArray = prop.property_services.split(',')
    const DBPropertyServicesArray = property_services.split(',')
    const validatedServicesArray = []
    newServicesArray.forEach(service => {
      if (DBPropertyServicesArray.indexOf(service) === -1) return validatedServicesArray.push(service)
    })
    await Promise.all(validatedServicesArray.map( async (service) => {
      await addPropertyService(prop.id, prop.property_name, service)
    }))
  }

  res.status(200).json({ 'results': changedData, 'success_code': newData[0]});
});

// EDIT PROPERTY SERVICE PRICE.
router.post('/editserviceprice', [auth, landlord], async (req, res) => {
  const serviceID= req.body.id;
  const servicePrice= req.body.service_price;

  const service = await Services.update({
    service_price: servicePrice
  },
  {
      where: {
        id: serviceID
      }
  });

  res.status(200).json({'result': service});
});

// DELETE PROPERTY SERVICE .
router.post('/deleteservice', [auth, landlord], async (req, res) => {
  const serviceID= req.body.id;

  const service = await Services.destroy({
    where: {
      id: serviceID
    }
  });

  res.status(200).json({'result': service});
});

module.exports = {
  router: router,
  mapLandlordID: mapLandlordID,
};
