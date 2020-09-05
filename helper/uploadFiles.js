const fs = require('fs');
const path = require('path');
const appRoot = path.join(__dirname, '..' +'/uploads');

module.exports = async (file, userID, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  const location = {
    property: 'properties',
    user: 'profile'
  };

  const uploadDirectory = `${appRoot}/images/${userID}/${location[type]}`;
  const uploadPath = `${appRoot}/images/${userID}/${location[type]}/${timeStamp}_${image.name}`;
  const displayPath = `/images/${userID}/${location[type]}/${timeStamp}_${image.name}`;

  const createDirPath = async () => {
    try {
      await fs.promises.mkdir(uploadDirectory, { recursive: true });
    } catch (err) {
      throw (err.message);
    }
  };

  const directoryExists = fs.access(uploadDirectory, (err) => {
    return !err;
  });

  const movePicture = () => {
    image.mv(uploadPath, (err) => {
      if (err) throw (err.message);
    });
  };

  if (!directoryExists) await createDirPath();
  movePicture();

  return displayPath
};
