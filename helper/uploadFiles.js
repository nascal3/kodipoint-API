const fs = require('fs');

module.exports = async (file, data, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  const location = {
    property: 'properties',
    user: 'profile'
  };

  const uploadDirectory = `./uploads/images/${data.user_id}/${location[type]}`;
  const uploadPath = `./uploads/images/${data.user_id}/${location[type]}/${timeStamp}_${image.name}`;
  const displayPath = `/images/${data.user_id}/${location[type]}/${timeStamp}_${image.name}`;

  if (!fs.existsSync(uploadDirectory)){
    // fs.mkdirSync(uploadPath);
    try {
      await fs.promises.mkdir(uploadDirectory, { recursive: true })
    } catch (err) {
      throw new Error(err);
    }
  }

  // Use the mv() method to place the file somewhere on your server
  image.mv(uploadPath, (err) => {
    if (err) throw new Error(err);
  });
  return displayPath
};
