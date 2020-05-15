const Sequelize = require('sequelize');
const connection= require('../startup/db');
const userModel = require('./userModel');

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
    phone: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    national_id: {
        type: Sequelize.STRING,
        allowNull: true
    },
    avatar: {
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
            unique: true,
            fields:["email", "user_id","national_id"]
        }
    ]
});

module.exports = tenantModel;
