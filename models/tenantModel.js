const Sequelize = require('sequelize');
const connection= require('../startup/db');
const userModel = require('./userModel');
const propertyModel = require('./propertyModel');

const tenantModel = connection.define('tenant', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: true
    },
    name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    email: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    national_id: {
        type: Sequelize.STRING,
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
    move_in_date: {
        type:Sequelize.DATE,
        allowNull: false
    },
    move_out_date: {
        type:Sequelize.DATE,
        allowNull: true
    },
    phone: {
        type:Sequelize.STRING,
        allowNull: true
    },
    avatar: {
        type:Sequelize.STRING,
        allowNull: true
    }
},{
    indexes:[
        {
            fields:['id', 'email', "user_id","national_id"]
        }
    ]
});

module.exports = tenantModel;
