require('dotenv').config();
const express = require('express');
const app = express();

// CALL TO DB CONNECTION FOLDER
const sequelize = require('./startup/db');

// CALL TO ROUTES FOLDER
require('./startup/routes')(app);

// CREATE TABLES IF THEY DON'T EXIST
let server = null;
sequelize.sync().then(result => {
    const port = process.env.PORT || 80 ;
    server = app.listen( port, console.log(`listening to port ${port}`));
}).catch( err => {
    console.error('Error occurred: ',err.name, '<===> Message: ',err.message);
});

module.exports = server;
