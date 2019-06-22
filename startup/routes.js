const express = require('express');
const users = require('../routes/users');

// const home = require('../routes/home');

module.exports = (app) => {
  app.use(express.json());
  app.use('/api/users', users);
  app.use(express.static(__dirname + 'public'));
};
