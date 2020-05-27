const fs = require('fs');

module.exports = async (file, userID, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  const location = {
    property: 'properties',
    user: 'profile'
  };

  const uploadDirectory = `./uploads/images/${userID}/${location[type]}`;
  const uploadPath = `./uploads/images/${userID}/${location[type]}/${timeStamp}_${image.name}`;
  const displayPath = `/images/${userID}/${location[type]}/${timeStamp}_${image.name}`;

  const createDirPath = async () => {
    try {
      await fs.promises.mkdir(uploadDirectory, { recursive: true });
    } catch (err) {
      throw new Error(err);
    }
  };

  const directoryExists = fs.access(uploadDirectory, (err) => {
    return !err;
  });

  const movePicture = () => {
    image.mv(uploadPath, (err) => {
      if (err) throw new Error(err);
    });
  };

  if (!directoryExists) await createDirPath();
  movePicture();

  return displayPath
};
