const path = require("path");
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

const { format, parseISO } = require('date-fns');
const appRoot = path.join(__dirname, '..' +'/uploads');
require('express-async-errors');

const helpers = {
    formatDate: function(value) {
        if (!value) return;
        return format(parseISO(value), 'MMM, d yyyy');
    },

    formatDateMonth: function(value) {
        if (!value) return;
        return format(parseISO(value), 'MMM yyyy');
    },

    thousandsSeparator: function(value) {
        if (!value && (value !== 0)) return;
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

const createInvoice = async () => {
    await generateInvoice();
}

/* invoice template page */
router.get('/invoice', async (req, res) => {
    res.render('invoiceTemplate', {
        helpers: helpers
    });
});

router.get('/create', async (req, res) => {
    await generateInvoice();
    res.send('done');
});

const generateInvoice = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage()

    await page.goto('http://localhost:3000/docs/invoice', {
        waitUntil: "networkidle2"
    });
    const pdf = await page.pdf({
        path: `${appRoot}/invoice.pdf`,
        format: "A4",
        printBackground: true
    });
    await page.emulateMediaType('screen');
    console.log('>>> created document');
    await browser.close();
}

module.exports = router;
