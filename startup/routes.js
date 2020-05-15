const express = require('express');
const cors = require('cors');
const users = require('../routes/users');
const landlords = require('../routes/landlords');
const tenants = require('../routes/tenants');
const tenantsProps = require('../routes/tenantsProps');
const properties = require('../routes/properties');
const path = require("path");
const fileUpload = require('express-fileupload');

module.exports = (app) => {
  app.use(
    cors(),
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
  app.use('/api/tenantsrec', tenantsProps);
  app.use('/api/properties', properties.router);
  app.use(express.static('public'));
  app.use('/file', express.static(path.join(__dirname, '..' +'/uploads')));
};
