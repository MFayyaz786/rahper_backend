const CryptoJS = require("crypto-js");

const cryptkey = CryptoJS.enc.Utf8.parse(process.env.CRYPTKEY);

const cryptiv = CryptoJS.enc.Utf8.parse(process.env.CRYPTIV);

// Encryption
// const data = JSON.stringify({ test: "123" });

module.exports = (data) => {
  const crypted = CryptoJS.enc.Base64.parse(data.toString()); //"Zt8VfHQqiKj/MToZGwWppw==");

  var decrypt = CryptoJS.AES.decrypt({ ciphertext: crypted }, cryptkey, {
    iv: cryptiv,
    mode: CryptoJS.mode.CTR,
  });
  // console.log(decrypt);
  const data2 = decrypt.toString(CryptoJS.enc.Utf8);
  if (data2) return JSON.parse(data2);
  return null;
};
