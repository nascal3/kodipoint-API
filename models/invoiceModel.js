const Sequelize = require('sequelize');
const connection = require('../startup/db');
const tenantModel = require('./tenantModel');
const propertyModel = require('./propertyModel');

const invoiceModel = connection.define('invoice', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tenant_id: {
        type: Sequelize.INTEGER,
        references: {
            model: tenantModel,
            key: tenantModel.id
        },
        allowNull: false
    },
    landlord_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    property_id: {
        type: Sequelize.INTEGER,
        references: {
            model: propertyModel,
            key: propertyModel.id
        },
        allowNull: false
    },
    property_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    unit_no: {
        type:Sequelize.STRING(10),
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
    }
},{
    indexes:[
        {
            unique: true,
            fields:['id']
        }
    ]
});

module.exports = invoiceModel;
