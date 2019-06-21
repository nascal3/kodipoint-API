const express = require('express');
const users = require('../routes/users');
const index = require('../routes/index');

module.exports = function (app) {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/', index);
};
