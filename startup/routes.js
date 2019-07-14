const express = require('express');
const users = require('../routes/users');
const landlords = require('../routes/landlords');
const tenants = require('../routes/tenants');

module.exports = (app) => {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/landlords', landlords);
  app.use('/api/tenants', tenants);
  app.use(express.static('public'));
};
