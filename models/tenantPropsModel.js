const Sequelize = require('sequelize');
const connection= require('../startup/db');
const tenantModel = require('./tenantModel');
const propertyModel = require('./propertyModel');

const tenantPropsModel = connection.define('tenant_property', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tenant_id: {
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
        type: Sequelize.STRING,
        allowNull: false
    },
    unit_rent: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    landlord_id: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    landlord_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    move_in_date: {
        type:Sequelize.DATE,
        allowNull: false
    },
    move_out_date: {
        type:Sequelize.DATE,
        allowNull: true
    },
    created_by: {
        type:Sequelize.INTEGER,
        allowNull: false
    },
    edited_by: {
        type:Sequelize.INTEGER,
        allowNull: true
    }
},{
    indexes:[
        {
            fields:["tenant_id", "property_id", "landlord_id"]
        }
    ]
});

module.exports = tenantPropsModel;
