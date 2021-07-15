require('dotenv').config();
const express = require('express');
const exphbs  = require('express-handlebars');
const app= express();

// handlebars helper functions
const docHelpers = require('./helper/templateValueHelpers')
const hbs = exphbs.create({
    helpers: docHelpers
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// CALL TO DB CONNECTION FOLDER
const sequelize = require('./startup/db');
const initModel1 = require('./models/invbreakModel');
const initModel2 = require('./models/tenantPropsModel');
const initModel3 = require('./models/receiptModel');

// CALL TO ROUTES FOLDER
require('./startup/routes')(app);

// CREATE TABLES IF THEY DON'T EXIST
let server = null;

( async() => {
    try {
        await sequelize.sync();
        await initModel1.sync();
        await initModel2.sync();
        await initModel3.sync();

        const port = process.env.PORT || 3000 ;
        server = app.listen( port, console.log(`listening to port ${port}`));

        if (!process.env.JWT_SECRET) return console.error("JWT key missing in environment");
        console.log('DB_HOST -->', process.env.DB_HOST);
        console.log('DB_USER -->', process.env.DB_USER);
        console.log('DB_PASSWORD -->', process.env.DB_PASSWORD);
        console.log('JWT_KEY -->', process.env.JWT_SECRET);
    } catch (err) {
        throw new Error(`Error occurred: ${err.name} ===> ${err.message}`);
    }
})();

module.exports = server;
