const nodemailer = require('nodemailer');
require('dotenv').config();

class Email {
    static sendEmail(to, subject, text, filename, fileContent) {
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
            from: 'info@kodipoint.com', // Update from email
            to: to,
            subject: subject,
            text: text,
            attachments: [{
                filename: filename,
                content: fileContent
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return console.error(error);
            console.log('>>> Message sent: %s', info.messageId);
        });
    }
}

module.exports = Email;
