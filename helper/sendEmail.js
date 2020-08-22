const nodemailer = require('nodemailer');
require('dotenv').config();


const sendEmail = async (to, subject, text, filename, fileContent) => {
    const transporter = nodemailer.createTransport({
        host: 'kodipoint.com',
        port: 587,
        secure: false,
        tls: { rejectUnauthorized: false },
        auth: {
            user: 'info@kodipoint.com',
            pass: process.env.EMAIL_SECRET
        }
    });

    const mailOptions = {
        from: 'info@kodipoint.com',
        to: to,
        subject: subject,
        text: text,
        attachments: [{
            filename: filename,
            content: fileContent
        }]
    };

    return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
