const express = require('express');
const users = require('../routes/users');
const landlords = require('../routes/landlords');

module.exports = (app) => {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/landlords', landlords);
  app.use(express.static('public'));
};
