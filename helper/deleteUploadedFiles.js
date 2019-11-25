const fs = require('fs');

module.exports = (filePath) => {
  if (filePath || filePath === null) return
  fs.unlinkSync(filePath);
  return true
};
