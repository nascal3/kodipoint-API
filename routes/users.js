const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Users = require('../models/userModel');

const generateToken = require('../middleware/usersTokenGen');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminAuth');

require('express-async-errors');

// GET ALL USERS LIST .
router.get('/:page', [auth, admin], async (req, res) => {
    let limit = 100;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await Users.findAndCountAll();
    let page = req.params.page ? parseInt(req.params.page) : 1;      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Users.findAll({
        limit: limit,
        offset: offset
    });

    // remove password data from json results
    users.password = undefined;

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

// GET ONE USER BY ID.
router.get('/user/:id', [auth, admin], async (req, res) => {
    const user = await Users.findOne({
        where: {
            id: req.params.id
        }
    });
    user.password = undefined;
    res.status(200).json({ 'results': user});
})

// LOGIN USERS PROCESS
router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    const userData = await Users.findOne({
        where: {
           email: username
        }
    });

    if (!userData) return res.status(400).json({'Error': 'Wrong Username or Password'});

    // check password validity
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) return res.status(400).json({'Error': 'Wrong Username or Password'});

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

// ***Function create a new user to DB***
const createUser = async (user_info) => {
    const userEmail = await Users.findOne({
        where: {
            email: user_info.username
        }
    });

    if (userEmail !== null) return false;

    // SALT THE PASSWORD AND INSERT NEW USER INTO DB
    const salt = await bcrypt.genSalt(10);
    const salted_password = await bcrypt.hash(user_info.password, salt);

    const userData = await Users.create({
        email: user_info.username,
        password: salted_password,
        name: user_info.name,
        role: user_info.role
    });

    //generate User token
    const token = generateToken(userData.id, userData.email, userData.role);

    // hide data from json results
    userData.password = undefined;
    userData.createdAt = undefined;
    userData.updatedAt = undefined;

    return {'data': userData, 'token': token};
};

// REGISTER NEW USERS PROCESS
router.post('/register', async (req, res) => {

    const params = {
        'username':req.body.username,
        'password':req.body.password,
        'name':req.body.name,
        'role':req.body.role
    };

    const results = await createUser(params);

    if (!results) return res.status(422).json({'Error': 'The following Email/Username already exists!'});

    // set authorisation header
    return res.header('Authorization', results.token).status(200).json({'user':results.data, 'token': results.token});

});

// ***Function edit a user details***
const editUser = async (user_info) => {
    const userEmail = await Users.findOne({
        where: {
            email: user_info.username,
            [Op.and]: {
                id: {
                    [Op.ne]: user_info.id
                }
            }
        }
    });

    if (userEmail !== null) return false;

    const newData = await Users.update({
        email: user_info.username,
        name: user_info.name,
        role: user_info.role
    },{
        where: {
            id: user_info.id
        }
    });

    // hide data from json results
    return {
        ...newData,
        password: undefined,
        createdAt: undefined,
        updatedAt: undefined
    }
}

// USERS CHANGE THEIR PASSWORD
router.post('/change/password', auth, async (req, res) => {

    // === get user ID from token in header ===
    let userID = req.user.id;

    let newPassword = req.body.newPassword;
    let oldPassword = req.body.oldPassword;

    const userData = await Users.findOne({
        where: {
            id: userID
        }
    });


    // check user password validity
    const validPassword = await bcrypt.compare(oldPassword, userData.password);
    if (!validPassword) return res.status(400).json({'Error': 'Wrong current Password'});

    // SALT THE NEW PASSWORD AND INSERT NEW USER INTO DB
    const salt = await bcrypt.genSalt(10);
    const salted_password = await bcrypt.hash(newPassword, salt);

    const userChange = await Users.update(
        {
            password: salted_password
        },
        {
            where: {
                id: userID
            }
        }
    );

    res.status(200).json({'success_code': userChange[0]});

});

// RESET USERS PASSWORD
router.post('/reset/password', auth, async (req, res) => {

    let username = req.body.username;
    let newPassword = Math.random().toString(36).substring(9);

    const userData = await Users.findOne({
        where: {
            email: username
        }
    });

    // check if user exists
    if (!userData) return res.status(400).json({'Error': 'The following  user does not exist!'});

    // SALT THE NEW PASSWORD AND INSERT NEW USER INTO DB
    const salt = await bcrypt.genSalt(10);
    const salted_password = await bcrypt.hash(newPassword, salt);

    const userChange = await Users.update(
        {
            password: salted_password
        },
        {
            where: {
                email: username
            }
        }
    );

    res.status(200).json({'result': newPassword, 'success_code': userChange[0]});

});

module.exports = {
    router: router,
    createNewUser: createUser,
    editUser: editUser
};
