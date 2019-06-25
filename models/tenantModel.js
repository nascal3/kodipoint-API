const Sequelize = require('sequelize');
const sequelize = require('../startup/db');
const userModel = require('./userModel');

const tenantModel = sequelize.define('tenant', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: userModel,
            key: 'id'
        },
        allowNull: true
    },
    name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    email: {
      type:Sequelize.STRING(50),
      allowNull: false
    },
    national_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    property_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    property_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    unit_no: {
        type: Sequelize.STRING,
        allowNull: false
    },
    landlord_id: {
      type:Sequelize.INTEGER,
      allowNull: false
    },
    move_in_date: {
      type:Sequelize.DATE,
      allowNull: false
    },
    phone: {
        type:Sequelize.STRING,
        allowNull: true
    },
    avatar: {
        type:Sequelize.STRING,
        allowNull: true
    }
  },
  {
      indexes:[
          {
              unique: true,
              fields:['id', 'email', "user_id"]
          }
      ]
  });

module.exports = tenantModel;
