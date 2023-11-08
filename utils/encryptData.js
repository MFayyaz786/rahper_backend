const CryptoJS = require("crypto-js");

const cryptkey = CryptoJS.enc.Utf8.parse(process.env.CRYPTKEY);

const cryptiv = CryptoJS.enc.Utf8.parse(process.env.CRYPTIV);

// Encryption
// const data = JSON.stringify({ test: "123" });

module.exports = (data) => {
  // if (process.env.NODE_ENV == "local") {
  //   return data;
  // }
  var encrypt = CryptoJS.AES.encrypt(JSON.stringify(data), cryptkey, {
    iv: cryptiv,
    mode: CryptoJS.mode.CTR,
  });
  const cipher = encrypt.toString();
  return { cipher };
};

// console.log(encrypt.toString());
