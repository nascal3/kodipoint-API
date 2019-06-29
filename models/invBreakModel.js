const Sequelize = require('sequelize');
const sequelize = require('../startup/db');
const invoiceModel = require('./invoiceModel');
const serviceModel = require('./serviceModel');

const invBreakModel = sequelize.define('invoice_breakdown', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_id: {
        type: Sequelize.INTEGER,
        references: {
            model: invoiceModel,
            key: invoiceModel.id
        },
        allowNull: false
    },
    service_id: {
        type: Sequelize.INTEGER,
        references: {
            model: serviceModel,
            key: serviceModel.id
        },
        allowNull: false
    },
    service_name: {
        type: Sequelize.STRING,
        references: {
            model: serviceModel,
            key: 'service_name'
        },
        allowNull: false
    },
    service_cost: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
  },
  {
      indexes:[
          {
              unique: true,
              fields:['service_id','service_name']
          }
      ]
  });

module.exports = invBreakModel;