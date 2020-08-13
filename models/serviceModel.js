const Sequelize = require('sequelize');
const connection= require('../startup/db');
const propertyModel = require('./propertyModel');

const serviceModel = connection.define('service', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    service_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    property_name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    property_id: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    service_price: {
        type:Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
},{
    indexes:[
        {
            fields:['service_name', 'property_id']
        }
    ]
});

propertyModel.hasMany(serviceModel, {
    foreignKey: 'property_id'
});
serviceModel.belongsTo(propertyModel, {
    foreignKey: 'property_id'
});

module.exports = serviceModel;
