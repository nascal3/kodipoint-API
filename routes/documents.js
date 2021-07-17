const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
require('express-async-errors');

/* set invoice data */
let invoiceData = null;
const setInvoiceData = (data) => {
    invoiceData = data;
}

/* invoice template page path */
router.get('/invoice', async (req, res) => {
    const jsonData = JSON.parse(invoiceData);
    res.render('invoiceTemplate', jsonData);
});

/* set receipt data */
let receiptData = null;
const setReceiptData = (data) => {
    receiptData = data;
}

/* receipt template page path */
router.get('/receipt', async (req, res) => {
    const jsonData = JSON.parse(receiptData);
    res.render('receiptTemplate', jsonData);
});

const generatePDF = async (url) => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage()

        await page.goto(url, {
            waitUntil: "networkidle2"
        });

        const pdf = await page.pdf({
            // path: `uploads/docs/invoice.pdf`,
            format: 'A4',
            printBackground: true
        });
        await page.emulateMediaType('screen');
        console.log('>>> created PDF document');
        await browser.close();
        return pdf;
    } catch (err) {
        throw err
    }
}

module.exports = {
    router: router,
    setInvoiceData: setInvoiceData,
    setReceiptData: setReceiptData,
    generatePDF: generatePDF
};
