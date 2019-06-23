const Sequelize = require('sequelize');
const sequelize = require('../startup/db');

const tenantModel = sequelize.define('tenant', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
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
        type:Sequelize.STRING(50),
        allowNull: false
    },
    property_id: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    unit_nos: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    landlord_id: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    date_moved_in: {
        type:Sequelize.DATE,
        allowNull: false
    },
    phone: {
        type:Sequelize.STRING(50),
        allowNull: false
    },
    avatar: {
        type:Sequelize.STRING(50),
        allowNull: true
    }
  },
  {
      indexes:[
          {
              unique: true,
              fields:['id','user_id','email']
          }
      ]
  });

module.exports = tenantModel;
