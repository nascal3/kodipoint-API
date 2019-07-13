const Sequelize = require('sequelize');
const connection= require('../startup/db');
const roleModel = require('./roleModel');

const userModel = connection.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    role: {
        type:Sequelize.STRING,
        allowNull: false
    },
    password: {
        type:Sequelize.STRING,
        allowNull: false
    }
},{
    indexes:[
        {
            unique: true,
            fields:['id','email']
        }
    ]
});

module.exports = userModel;
