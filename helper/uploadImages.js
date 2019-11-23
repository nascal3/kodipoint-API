module.exports = (file, property) => {
  const propertyImage = file.file;
  const timeStamp = +new Date();

  // Use the mv() method to place the file somewhere on your server
  propertyImage.mv(`./uploads/images/${property.user_id}/properties/${timeStamp}_${propertyImage.name}`, (err) => {
    if (err) throw new Error(err);
  });
  return  `/uploads/images/${property.user_id}/properties/${timeStamp}_${propertyImage.name}`;
};
