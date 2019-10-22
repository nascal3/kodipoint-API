const jwt = require('jsonwebtoken');

const generateAuthToken = (id, email, name, role) => {
   return jwt.sign({
      id: id,
      email: email,
      name: email,
      role: role
   },
      process.env.JWT_SECRET );
};

module.exports = generateAuthToken;
