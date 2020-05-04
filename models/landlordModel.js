const Sequelize = require('sequelize');
const connection= require('../startup/db');
const userModel = require('./userModel');

const landlordModel = connection.define('landlord', {
    landlord_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        unique: true,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: false
    },
    name: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    email: {
        type:Sequelize.STRING(50),
        unique: true,
        allowNull: false
    },
    national_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
    },
    kra_pin: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
    },
    phone: {
        type: Sequelize.STRING(30),
        allowNull: false
    },
    bank_name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bank_branch: {
        type:Sequelize.STRING,
        allowNull: true
    },
    bank_acc: {
        type:Sequelize.STRING,
        allowNull: true
    },
    bank_swift: {
        type:Sequelize.STRING,
        allowNull: true
    },
    bank_currency: {
        type:Sequelize.STRING,
        defaultValue: 'Ksh',
        allowNull: true
    },
    avatar: {
        type:Sequelize.STRING,
        allowNull: true
    },
    approved: {
        type:Sequelize.BOOLEAN,
        defaultValue: 0,
        allowNull: false
    },
    updatedBy: {
        type:Sequelize.INTEGER,
        references: {
            model: userModel,
            key: userModel.id
        },
        allowNull: false
    }
}, {
    indexes:[
        {
            fields:['national_id', 'email', 'user_id', 'name']
        }
    ]
})

module.exports = landlordModel;
