const { Client } = require('nextcloud-node-client');

module.exports = async (userID, type) => {

  const location = {
    property: 'properties',
    user: 'profile'
  };

  try {
    const client = new Client();
    // get folder
    const folder = await client.getFolder(`uploads/images/${userID}/${location[type]}`);
    if (!folder) return true;
    //delete folder
    await folder.delete();
    return true;
  } catch (err) {
    throw err
  }
};
