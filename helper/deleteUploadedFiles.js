const fs = require('fs');

module.exports = (filePath) => {
  if (!filePath) return
  fs.unlinkSync(filePath);
  return true
};
