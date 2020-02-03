const jwt = require('jsonwebtoken');

const  auth = (req, res, next) => {
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  // );
  
  // if (req.method === 'OPTIONS') {
  //   res.header('Access-Control-Allow-Headers', 'PUT, POST, PATCH, DELETE, GET');
  //   next();
  //   // return res.status(200).json({})
  // }

  const token = req.header('Authorization');
  if (!token) return res.status(401).json({'Error':'Access denied, user not logged in or no token provided!'});

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(400).send('Invalid token');
  }

};

module.exports = auth;
