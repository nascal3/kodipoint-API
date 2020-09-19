const express = require('express');
const router = express.Router();

const generateToken = require('../middleware/usersTokenGen');
const Users = require('../models/userModel');

require('express-async-errors');

// GET SPECIFIC TENANT INVOICE BALANCE CARRIED FORWARD
router.post('/auth', async (req, res) => {
    const userProfile = req.body
    console.log('>>>', userProfile)

    const userData = await Users.findOne({
        where: {
            email: userProfile.bu
        }
    });
    if (!userData) return res.status(400).json({'Error': 'The following user does not exist!'});

    // generate user tokens
    const token = generateToken(
        userData.id,
        userData.email,
        userData.name,
        userData.role,
    );

    // hide data from json results
    userData.password = undefined;

    // set authorisation header
    return res.header('Authorization', token).status(200).json({'user':userData, 'token': token});
});

module.exports = router;
