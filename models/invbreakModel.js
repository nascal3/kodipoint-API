const Sequelize = require('sequelize');
const connection = require('../startup/db');
const invoiceModel = require('./invoiceModel');

const invbreakModel = connection.define('invoice_breakdown', {
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
    service_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    service_price: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
},{
    indexes:[
        {
            fields:['service_name']
        }
    ]
});

invoiceModel.hasMany(invbreakModel, {
    foreignKey: 'invoice_id'
});
invbreakModel.belongsTo(invoiceModel, {
    foreignKey: 'invoice_id'
});

module.exports = invbreakModel;
