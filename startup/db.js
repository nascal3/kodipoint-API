const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: 'mssql',
      host: process.env.DB_HOST,
      dialectOptions: {
        encrypt: true,
        requestTimeout: 30000
      },
      operatorsAliases: false
    }
);

module.exports = sequelize;
