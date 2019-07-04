const jwt = require('jsonwebtoken');

const generateAuthToken = (id, email, role) => {
   return jwt.sign({
      id: id,
      email: email,
      role: role
   },
      process.env.JWT_PRIVATE_KEY );
};

module.exports = generateAuthToken;
