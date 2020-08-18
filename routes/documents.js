const path = require("path");
const express = require('express');
const router = express.Router();

/* invoice template page */
router.get('/invoice', (req, res) => {
    res.sendFile(path.join( __dirname, '..' +'/public/documents/invoiceTemplate.html'));
});

module.exports = router;
