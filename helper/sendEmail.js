const nodemailer = require('nodemailer');

class Email {
    static sendEmail(to, subject, text, filename, fileContent) {
        const transporter = nodemailer.createTransport({
            host: 'kodipoint.com',
            port: 587,
            // secureConnection: true, // Used for Office 365
            // tls: { ciphers: 'SSLv3' }, // Used for Office 365
            auth: {
                user: 'info@kodipoint.com', // Update username
                pass: '2cx591lTHr' // Update password
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
            if (error) {
                return console.log(error);
            }

            console.log('Message sent: %s', info.messageId);
        });
    }
}

module.exports = Email;
