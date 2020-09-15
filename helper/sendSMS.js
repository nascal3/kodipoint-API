require('dotenv').config();
const credentials = {
    apiKey: process.env.API_KEY,
    username: process.env.API_USER
};
const AfricaTalking = require('africastalking')(credentials);

// Initialize a service e.g. SMS
const sms = AfricaTalking.SMS

// Send message and capture the response or error
const sendSMS = async (to, message) => {
    const options = {
        to: to,
        message: message
    }

    try {
       return await sms.send(options);
    }catch (err) {
        throw err
    }
}

module.exports = sendSMS;
