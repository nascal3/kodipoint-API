const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');

const users = require('../routes/users');
const landlords = require('../routes/landlords');
const tenants = require('../routes/tenants');
const tenantsProps = require('../routes/tenantsProps');
const properties = require('../routes/properties');
const invoice = require('../routes/invoice');
const documents = require('../routes/documents');

module.exports = (app) => {
  app.use(helmet());
  app.use(compression());
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
  app.use('/api/invoice', invoice);
  app.use('/docs', documents.router);
  app.use(express.static('public'));
  app.use('/file', express.static(path.join(__dirname, '..' +'/uploads')));
};
