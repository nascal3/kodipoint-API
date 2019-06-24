const Sequelize = require('sequelize');
const sequelize = require('../startup/db');

const roleModel = sequelize.define('role', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_name: {
      type:Sequelize.STRING(50),
      allowNull: false
    },
    role_nos: {
      type:Sequelize.INTEGER,
      allowNull: false
    }
  });

module.exports = roleModel;
