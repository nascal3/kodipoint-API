const Sequelize = require('sequelize');
const sequelize = require('../startup/db');
const tenantModel = require('./tenantModel');
const landlordModel = require('./landlordModel');
const propertyModel = require('./propertyModel');

const invoiceModel = sequelize.define('invoice', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
        type: Sequelize.INTEGER,
        references: {
            model: tenantModel,
            key: 'id'
        },
        allowNull: false
    },
    landlord_id: {
        type: Sequelize.INTEGER,
        references: {
            model: landlordModel,
            key: 'id'
        },
        allowNull: false
    },
    property_id: {
        type: Sequelize.INTEGER,
        references: {
            model: propertyModel,
            key: 'id'
        },
        allowNull: false
    },
    date_issued: {
      type:Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    },
    date_paid: {
        type: Sequelize.DATE,
        allowNull: true
    },
    amount_owed: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    amount_paid: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    amount_balance: {
        type: Sequelize.INTEGER,
        defaultValue: this.amount_owed,
        allowNull: false
    },
    unit_no: {
        type:Sequelize.STRING(10),
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

module.exports = invoiceModel;
