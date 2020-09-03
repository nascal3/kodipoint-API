const { Client, CommandStatus, UploadFilesCommand } = require('nextcloud-node-client');

module.exports = async (file, userID, type) => {
  const image = file.file;
  const timeStamp = +new Date();

  const location = {
    property: 'properties',
    user: 'profile'
  };

  try {
    const client = new Client();

    // create a folder structure if not available
    await client.createFolder(`uploads/images/${userID}/${location[type]}`);

    // create a list of files to upload
    const files = [
      {
        sourceFileName: image.tempFilePath,
        targetFileName: `/uploads/images/${userID}/${location[type]}/${timeStamp}_${image.name}`
      }
    ];

    // create the command object
    const uc = new UploadFilesCommand(client, { files });

    // start the upload asynchronously (will not throw exceptions!)
    uc.execute();

    // check the processing status as long as the command is running
    while (uc.isFinished() !== true) {
      // wait one second
      await (async () => { return new Promise(resolve => setTimeout(resolve, 1000)) })();
      console.log(uc.getPercentCompleted() + "%");
    }

    // use the result to do the needful
    const uploadResult = uc.getResultMetaData();

    if (uc.getStatus() === CommandStatus.success) {
      console.log(uploadResult.messages);
      console.log(uc.getBytesUploaded());
      const file = await client.getFile(`/uploads/images/${userID}/${location[type]}/${timeStamp}_${image.name}`);
      const share = await client.createShare({ fileSystemElement: file });
      return `${share.url}/preview`;
    } else {
      console.error(uploadResult.errors);
    }

  } catch (err) {
    throw err
  }

};
