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
       const response = await sms.send(options);
       console.log('>>> SMS sent');
       return response;
    }catch (err) {
        throw err
    }
}

module.exports = sendSMS;
