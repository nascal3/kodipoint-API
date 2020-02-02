require('dotenv').config();
const express = require('express');
const app= express();

// CALL TO DB CONNECTION FOLDER
const sequelize = require('./startup/db');
const initModel1 = require('./models/invbreakModel');
const initModel2 = require('./models/tenantRecModel');

// CALL TO ROUTES FOLDER
require('./startup/routes')(app);

// CREATE TABLES IF THEY DON'T EXIST
let server = null;

sequelize.sync().then(() => {
    initModel1.sync();
    initModel2.sync();

    const port = process.env.PORT || 3000 ;
    server = app.listen( port, console.log(`listening to port ${port}`));

    if (!process.env.JWT_SECRET) throw new Error("JWT key missing in environment");
    console.log('DB_HOST -->', process.env.DB_HOST);
    console.log('DB_USER -->', process.env.DB_USER);
    console.log('DB_PASSWORD -->', process.env.DB_PASSWORD);
    console.log('JWT_KEY -->', process.env.JWT_SECRET);
}).catch( err => {
    console.error('Error occurred: ',err.name, '<===> Message: ',err.message);
});

module.exports = server;
