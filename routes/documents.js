const path = require("path");
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const appRoot = path.join(__dirname, '..' +'/uploads');
require('express-async-errors');

let invoiceData = null;
const setInvoiceData = (data) => {
    invoiceData = data;
}

/* invoice template page path */
router.get('/invoice', async (req, res) => {
    const jsonData = JSON.parse(invoiceData);
    console.log('>>>>', jsonData);
    res.render('invoiceTemplate', jsonData);
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

module.exports = {
    router: router,
    setInvoiceData: setInvoiceData
};
