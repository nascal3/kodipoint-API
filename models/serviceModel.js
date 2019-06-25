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
              fields:['id']
          }
      ]
  });

module.exports = serviceModel;
