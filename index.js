require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app= express();

// ADDED CORS
app.use(cors({
    origin: 'http://localhost:3000'
}));

// CALL TO DB CONNECTION FOLDER
const sequelize = require('./startup/db');
const initModels = require('./models/invbreakModel');

// CALL TO ROUTES FOLDER
require('./startup/routes')(app);

// CREATE TABLES IF THEY DON'T EXIST
let server = null;

sequelize.sync().then(result => {
    initModels.sync();
    const port = process.env.PORT || 80 ;
    server = app.listen( port, console.log(`listening to port ${port}`));

    console.log('DB_HOST -->', process.env.DB_HOST);
    console.log('DB_USER -->', process.env.DB_USER);
    console.log('DB_PASSWORD -->', process.env.DB_PASSWORD);
}).catch( err => {
    console.error('Error occurred: ',err.name, '<===> Message: ',err.message);
});

module.exports = server;
