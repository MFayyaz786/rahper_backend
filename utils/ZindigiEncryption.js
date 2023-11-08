const crypto = require("crypto");
const fs = require("fs");
module.exports = (data) => {
  data = data.toString();
  if (data.length < 5) {
    data = "0".repeat(5 - data.length) + data;
  }
  console.log(data);
  key = fs.readFileSync("zindigikey.txt").toString();

  const encryptedData = crypto.publicEncrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(data)
  );

  return encryptedData.toString("base64");
};
