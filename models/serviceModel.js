const Sequelize = require('sequelize');
const sequelize = require('../startup/db');

const serviceModel = sequelize.define('service', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    service_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    }
  },
  {
      indexes:[
          {
              unique: true,
              fields:['service_name']
          }
      ]
  });

module.exports = serviceModel;
