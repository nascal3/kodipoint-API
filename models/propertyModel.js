const Sequelize = require('sequelize');
const connection= require('../startup/db');
const userModel = require('./userModel');

const propertyModel = connection.define('property', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    landlord_id: {
        type: Sequelize.INTEGER,
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
        allowNull: true
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
    property_location: {
        type:Sequelize.TEXT,
        allowNull: false
    },
    property_coordinates: {
        type:Sequelize.STRING(30),
        allowNull: false
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
    },
    approved: {
        type:Sequelize.BOOLEAN,
        allowNull: false
    },
    approvedBy: {
        type:Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: true
    },
},{
    indexes:[
        {
            fields:['id', 'lr_nos', 'property_name']
        }
    ]
});

module.exports = propertyModel;
