const jwt = require('jsonwebtoken');

const generateAuthToken = (id, email, name, role) => {
   return jwt.sign({
      id: id,
      email: email,
      name: name,
      role: role
   }, process.env.JWT_SECRET,
   { expiresIn: '24h' });
};

module.exports = generateAuthToken;
