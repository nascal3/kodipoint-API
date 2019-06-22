const Sequelize = require('sequelize');
const sequelize = require('../startup/db');

const userModel = sequelize.define('User', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_email: {
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
              unique: false,
              fields:['id', 'user_email']
          }
      ]
  });

module.exports = userModel;