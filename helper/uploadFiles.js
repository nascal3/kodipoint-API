module.exports = (file, data, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  let uploadPath = '';
  let displayPath = '';
  if (type === 'property') {
    uploadPath = `./uploads/images/${data.user_id}/properties/${timeStamp}_${image.name}`;
    displayPath = `/images/${data.user_id}/properties/${timeStamp}_${image.name}`;
  } else if (type === 'user') {
    uploadPath = `./uploads/images/${data.user_id}/user/${timeStamp}_${image.name}`;
    displayPath = `/images/${data.user_id}/user/${timeStamp}_${image.name}`;
  }

  // Use the mv() method to place the file somewhere on your server
  image.mv(uploadPath, (err) => {
    if (err) throw new Error(err);
  });
  return displayPath
};
