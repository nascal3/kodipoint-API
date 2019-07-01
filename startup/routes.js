const express = require('express');
const users = require('../routes/users');

module.exports = (app) => {
  app.use(express.json());
  app.use('/api/users', users);
  app.use(express.static('public'));
};
