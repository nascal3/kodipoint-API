const fs = require('fs');
const fsPromises = fs.promises;

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

  if (!fs.existsSync(uploadDirectory)){
    try {
      await fsPromises.mkdir(uploadDirectory);
      // Use the mv() method to place the file somewhere on your server
      image.mv(uploadPath, (err) => {
        if (err) throw new Error(err);
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  return displayPath
};
