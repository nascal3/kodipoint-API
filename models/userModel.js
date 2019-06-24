const Sequelize = require('sequelize');
const sequelize = require('../startup/db');

const userModel = sequelize.define('user', {
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
      allowNull: false
    },
    user_password: {
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
