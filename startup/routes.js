const express = require('express');
const users = require('../routes/users');

const home = require('../routes/home');

module.exports = (app) => {
  app.use(express.json());
  app.use('/api/users', users);
  // app.use('/', home);
  app.use(express.static('public'));
};
