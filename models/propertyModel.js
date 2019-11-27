const Sequelize = require('sequelize');
const connection= require('../startup/db');
const landlordModel = require('./landlordModel');
const userModel = require('./userModel');

const propertyModel = connection.define('property', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    landlord_id: {
        type: Sequelize.INTEGER,
        references: {
            model: landlordModel,
            key: landlordModel.id
        },
        allowNull: false
    },
    property_name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    property_type: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    contact_person: {
        type: Sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lr_nos: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    nos_units: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    description: {
        type:Sequelize.TEXT,
        allowNull: true
    },
    property_services: {
        type:Sequelize.TEXT,
        allowNull: true
    },
    property_img: {
        type:Sequelize.STRING,
        allowNull: true
    },
    updatedBy: {
        type:Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: false
    }

},{
    indexes:[
        {
            fields:['id', 'lr_nos', 'property_name']
        }
    ]
});

module.exports = propertyModel;
