module.exports = (file, data, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  const location = {
    property: 'properties',
    user: 'profile'
  };

  const uploadPath = `./uploads/images/${data.user_id}/${location[type]}/${timeStamp}_${image.name}`;
  const displayPath = `/images/${data.user_id}/${location[type]}/${timeStamp}_${image.name}`;

  // Use the mv() method to place the file somewhere on your server
  image.mv(uploadPath, (err) => {
    if (err) throw new Error(err);
  });
  return displayPath
};
