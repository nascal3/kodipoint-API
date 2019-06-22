const express = require('express');
const router = express.Router();
const Users = require('../models/userModel');
require('express-async-errors');

/* GET users listing. */
router.get('/:page', async (req, res) => {
    let limit = 50;   // number of records per page
    let offset;
    let pageNumber = req.params.page;

    const data = await Users.findAndCountAll();
    let page = parseInt(req.params.page);      // page number
    page <= 0 ? page = 1 : page = parseInt(req.params.page);
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);

    const users = await Users.findAll({
        attributes: {exclude: ['Password']},
        limit: limit,
        offset: offset
    });

    res.status(200).json({'result': users, 'currentPage': pageNumber, 'pages': pages});
});

module.exports = router;
