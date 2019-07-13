const Sequelize = require('sequelize');
const connection= require('../startup/db');

const roleModel = connection.define('role', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    role_name: {
        type:Sequelize.STRING(50),
        unique: true,
        allowNull: false
    }
});

module.exports = roleModel;
