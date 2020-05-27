const fs = require('fs');

module.exports = (filePath) => {
  if (filePath || filePath === null) return;
  fs.unlink(filePath, (err) => {
    if (err) throw err;
    return true
  });
  return false;
};
