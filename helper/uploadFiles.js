const fs = require('fs');
const mkdirp = require('mkdirp');

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
    try {
      // await mkdirp(uploadPath);
      await fs.mkdir(uploadDirectory, { recursive: true });

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
