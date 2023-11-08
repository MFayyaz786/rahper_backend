const fs = require("fs");

const uploadFile = async (file) => {
  try {
    const [, fileType, fileData] = file.match(/^data:(.+);base64,(.+)$/);
    const [fileMainType, fileSubType] = fileType.split("/");
    const fileBuffer = new Buffer.from(fileData, "base64");
    const fileName = Date.now() + "." + fileSubType;
    let filePath = null;
    let filePathPrefix = null;
    if (fileMainType === "image") {
      filePathPrefix = "images/";
      filePath = "public/images/" + fileName;
    } else if (fileMainType === "video") {
      filePathPrefix = "videos/";
      filePath = "public/videos/" + fileName;
    } else {
      filePathPrefix = "files/";
      filePath = "public/files/" + fileName;
    }
    await fs.promises.writeFile(filePath, fileBuffer);
    return filePathPrefix + fileName;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = uploadFile;
