const Sequelize = require('sequelize');
const sequalize = require('../startup/db');
const roleModel = require('./roleModel');

const userModel = sequalize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type:Sequelize.STRING(50),
      allowNull: false
    },
    role: {
      type:Sequelize.INTEGER,
      references: {
        model: roleModel,
        key: roleModel.role_nos
      },
      allowNull: false
    },
    password: {
      type:Sequelize.STRING,
      allowNull: false
    }
  },
  {
      indexes:[
          {
              unique: true,
              fields:['id', 'email']
          }
      ]
  });

module.exports = userModel;
