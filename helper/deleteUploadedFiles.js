const fs = require('fs');

module.exports = (file) => {
  fs.unlinkSync(file);
  return true
};
