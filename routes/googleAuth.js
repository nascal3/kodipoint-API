const express = require('express');
const router = express.Router();

const generateToken = require('../middleware/usersTokenGen');
const Users = require('../models/userModel');
const user = require('./users');

require('express-async-errors');

// ***find user in database**
const findUser = async(email) => {
    return await Users.findOne({
        where: {
            email: email
        },
        raw: true
    });
};

//get flattened user google details
const userDetailsArray = (userInfoObject) => {
    const userPropertyArray = []
    for (let key in userInfoObject) {
        userPropertyArray.push(userInfoObject[key])
    }
    return userPropertyArray;
}

// LOGIN USER VIA GOOGLE AUTH
router.post('/auth', async (req, res) => {
    const userProfile = req.body

    if (!Object.keys(userProfile).length) return  res.status(400).json({'Error': 'The following user does not exist!'});
    const userPropertyArray = userDetailsArray(userProfile);

    const email = userPropertyArray.filter(value => value.includes("@gmail.com"));
    const userData = await findUser(email[0]);
    if (!Object.keys(userData).length) return res.status(400).json({'Error': 'The following user does not exist!'});

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

// REGISTER USER VIA GOOGLE AUTH
router.post('/register', async (req, res) => {
    const userProfile = req.body.profile;
    const role = req.body.role;

    if (!Object.keys(userProfile).length) return  res.status(400).json({'Error': 'The following Email/Username already exists!'});
    const userPropertyArray = userDetailsArray(userProfile);

    const userData = await findUser(userPropertyArray[5]);
    if (userData && Object.keys(userData).length) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    const newUser = await Users.create({
        email: userPropertyArray[5],
        name: userPropertyArray[1],
        role: role
    });
    const newUserID = newUser.id;

    if (role === 'tenant') {
        await user.createNewTenant(newUserID, newUser, userPropertyArray[4], newUserID);
    } else if (role === 'landlord') {
        await user.createNewLandlord(newUserID, newUser, userPropertyArray[4], newUserID);
    } else {
        await user.createNewLandlord(newUserID, newUser, userPropertyArray[4], newUserID);
        await user.createNewTenant(newUserID, newUser, userPropertyArray[4], newUserID);
    }

    // generate user tokens
    const token = generateToken(
        newUser.id,
        newUser.email,
        newUser.name,
        newUser.role,
    );

    // set authorisation header
    return res.header('Authorization', token).status(200).json({'user':newUser, 'token': token});
});

module.exports = router;
