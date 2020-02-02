const express = require('express');
const cors = require('cors');
const users = require('../routes/users');
const landlords = require('../routes/landlords');
const tenants = require('../routes/tenants');
const tenantsRec = require('../routes/tenantsRec');
const properties = require('../routes/properties');
const path = require("path");
const fileUpload = require('express-fileupload');

module.exports = (app) => {
  app.use(cors());
  app.use(
    express.json(),
    fileUpload({
      createParentPath: true,
      useTempFiles : true,
      tempFileDir : '/tmp/'
    })
  );
  app.use('/api/users', users.router);
  app.use('/api/landlords', landlords);
  app.use('/api/tenants', tenants);
  app.use('/api/tenantsrec', tenantsRec);
  app.use('/api/properties', properties);
  app.use(express.static('public'));
  app.use('/file', express.static(path.join(__dirname, '..' +'/uploads')));
};
