const fs = require('fs');
const path = require('path');
const appRoot = path.join(__dirname, '..' +'/uploads');

module.exports = async (filePath) => {

  if (!filePath) return true;
  const directoryPath = `${appRoot}${filePath}`;
    fs.unlink(directoryPath, (err) => {
      if (err) return false;
    });
  return true;
};
