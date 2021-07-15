const Sequelize = require('sequelize');
const connection = require('../startup/db');
const invoiceModel = require('./invoiceModel');
const propertyModel = require('./propertyModel');
const userModel = require('./userModel');

const receiptModel = connection.define('receipt', {
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
    rent_period: {
        type:Sequelize.DATEONLY,
        allowNull: false
    },
    date_issued: {
        type:Sequelize.DATE,
        allowNull: true
    },
    rent_amount: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    amount_bf: {
        type:Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    already_paid: {
        type:Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    services_amount: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    amount_owed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    payment_method: {
        type: Sequelize.STRING,
        allowNull: false
    },
    paid: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    amount_balance: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdBy: {
        type: Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: false
    },
},{
    indexes:[
        {
            unique: true,
            fields:['id']
        }
    ]
});

module.exports = receiptModel;
