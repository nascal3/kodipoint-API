const express = require('express');
const users = require('../routes/users');
const landlords = require('../routes/landlords');
const tenants = require('../routes/tenants');
const tenantsRec = require('../routes/tenantsRec');
const properties = require('../routes/properties');
const fileUpload = require('express-fileupload');

module.exports = (app) => {
  app.use(
    express.json(),
    fileUpload({
      useTempFiles : true,
      tempFileDir : '/tmp/'
    })
  );
  app.use('/api/users', users);
  app.use('/api/landlords', landlords);
  app.use('/api/tenants', tenants);
  app.use('/api/tenantsrec', tenantsRec);
  app.use('/api/properties', properties);
  app.use(express.static('public'));
};
