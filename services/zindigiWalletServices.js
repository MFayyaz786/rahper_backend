const { default: axios } = require("axios");
const convertDate = require("../utils/convertDate");
const convertMobileFormate = require("../utils/convertMobileFormate");

const zindigiAccessTokens = require("../utils/zindigiAccessTokens");
const ZindigiEncryption = require("../utils/ZindigiEncryption");
const zindigiLogServices = require("./zindigiLogServeres");
let traceNo = 100080;
const zindigiWalletServerices = {
  verifyAccountToLink: async (cnic, mobileNo, dateTime) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    const body = {
      cnic,
      mobileNo,
      dateTime,
      processingCode: "VerifyAccount",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
      reserved1: "02",
      transactionType: "02",
      reserved2: "01",
    };
    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsbankblbservices/v1/verifyAccount",
        body
      );
    } catch (err) {
      console.log(err);
    }
    Access_token = zindigiAccessTokens.VerifyAccount;
    url = `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/verifyAccount`;
    const options = {
      headers: { Access_token },
    };
    const data = await axios.post(url, JSON.stringify(body), options);
    console.log(data.data);
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, data.data);
    } catch (err) {
      console.log(err);
    }
    return data.data;
  },
  linkAccount: async (dateTime, mobileNo, cnic, otpPin) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    otpPin = ZindigiEncryption(Number(otpPin));
    dateTime = convertDate(dateTime);
    const data = {
      dateTime,
      mobileNo,
      cnic,
      otpPin,
      processingCode: "LinkAccount",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
      transactionType: "01",
      reserved1: "02",
    };

    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsbankblbservices/v1/linkAccount",
        data
      );
    } catch (err) {
      console.log(err);
    }
    Access_token = zindigiAccessTokens.LinkAccount;
    const options = {
      headers: { Access_token },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/linkAccount`,
      data,
      options
    );

    console.log(res.data);
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, res.data);
    } catch (err) {
      console.log(err);
    }
    return res.data;
  },
  getWalletInfo: async (accountNumber) => {
    console.log(accountNumber);
    const wallet = await zindigiWalletServerices.balanceInquiry(
      new Date(),
      accountNumber,
      null
    );
    console.log(wallet);
    if (wallet.responseCode == "00") {
      return { title: "Account Title", balance: Number(wallet.balance) };
    } else {
      return { title: "", balance: 0 };
    }
  },

  accountOpening: async (
    dateTime,
    cnic,
    cnicIssuanceDate,
    mobileNo,
    mobileNetwork,
    emailId
  ) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    cnicIssuanceDate = convertDate(cnicIssuanceDate).slice(0, 8);
    const data = {
      dateTime,
      cnic,
      cnicIssuanceDate,
      mobileNo,
      mobileNetwork,
      emailId,
      processingCode: "AccountOpening",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
      reserved1: "01",
      reserved2: "RAHPER",
      reserved3: "",
      reserved4: "",
      reserved5: "",
    };
    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsbankblbservices/v1/accountOpening",
        data
      );
    } catch (err) {
      console.log(err);
    }
    Access_token = zindigiAccessTokens.AccountOpening;
    const options = {
      headers: { Access_token },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/accountOpening`,
      data,
      options
    );
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, res.data);
    } catch (err) {
      console.log(err);
    }
    return res.data;
  },

  generateOTPAccOpening: async (cnic, mobileNo, dateTime) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    const data = {
      cnic,
      mobileNo,
      dateTime,
      processingCode: "AccountOpening-GenerateOTP",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
      reserved1: "02",
      transactionType: "01",
    };
    const options = {
      headers: { Access_token: "otp!@#" },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/generateOTPAccOpening`,
      data,
      options
    );
    console.log(res.data);
    return res.data;
  },
  verifyOTPAccOpening: async (dateTime, cnic, mobileNo, otpPin) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    const data = {
      dateTime,
      cnic,
      mobileNo,
      otpPin,
      processingCode: "AccountOpening-VerifyOTP",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
    };
    const options = {
      headers: { Access_token: "otp!@#" },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/verifyOTPAccOpening`,
      data,
      options
    );
    console.log(res.data);
    return res.data;
  },
  generateMPIN: async (dateTime, mobileNo, mPin, confirmMpin) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    const data = {
      dateTime,
      mobileNo,
      mPin,
      confirmMpin,
      processingCode: "GenerateMPIN",
      merchantType: "0088",
      traceNo: traceNo.toString(),
      companyName: "RAHPER",
      terminalId: "RAHPER",
    };
    const options = {
      headers: { Access_token: "verifyAcc!@#" },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/generateMpin`,
      data,
      options
    );

    return res.data;
  },
  balanceInquiry: async (dateTime, mobileNo, otpPin) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(dateTime);
    const body = {
      dateTime,
      mobileNo,
      traceNo: traceNo.toString(),
      processingCode: "BalanceInquiry",
      merchantType: "0088",
      companyName: "RAHPER",
      terminalId: "RAHPER",
      otpPin: "",
      reserved1: "01",
    };
    console.log(body);
    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsbankblbservices/v1/balanceInquiry",
        body
      );
    } catch (err) {
      console.log(err);
    }
    Access_token = zindigiAccessTokens.BalanceInquiry;
    url = `${process.env.ZINDGIBASEURL}jsbankblbservices/v1/balanceInquiry`;
    const options = {
      headers: { Access_token },
    };
    const res = await axios.post(url, JSON.stringify(body), options);
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, res.data);
    } catch (err) {
      console.log(err);
    }
    if (res.data.responseCode == "00") {
      res.data.balance = Math.floor(Number(res.data.balance));
    }
    return res.data;
  },

  paymentInquiry: async (dateTime, mobileNumber, amount) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(new Date());
    let data = {
      dateTime,
      mobileNo: mobileNumber,
      traceNo: traceNo.toString(),
      processingCode: "DebitInquiry",
      merchantType: "0088",
      companyName: "RAHPER",
      channelId: "RAHPER",
      terminalId: "RAHPER",
      productId: "10245372",
      pinType: "02",
      transactionAmount: amount.toString(),
      reserved1: "abc",
      reserved2: "",
      reserved3: "",
      reserved4: "",
      reserved5: "",
      reserved6: "",
      reserved7: "",
      reserved8: "",
      reserved9: "",
      reserved10: "",
    };

    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsbankblbdigitalservices/v1/DebitInquiry",
        data
      );
    } catch (err) {
      console.log(err);
    }

    Access_token = zindigiAccessTokens.DebitInquiry;
    const options = {
      headers: { Access_token },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsbankblbdigitalservices/v1/DebitInquiry`,
      data,
      options
    );
    console.log(res.data);
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, res.data);
    } catch (err) {
      console.log(err);
    }
    return res.data;
  },

  payment: async (dateTime, mobileNumber, otpPin, amount) => {
    if (traceNo < 999999) {
      traceNo++;
    } else {
      traceNo = 100000;
    }
    dateTime = convertDate(new Date());
    otpPin = ZindigiEncryption(Number(otpPin));
    let data = {
      dateTime,
      mobileNo: mobileNumber,
      traceNo: traceNo.toString(),
      transactionAmount: amount.toString(),
      processingCode: "DebitPayment",
      merchantType: "0088",
      companyName: "RAHPER",
      channelId: "RAHPER",
      terminalId: "RAHPER",
      productId: "10245372",
      otpPin,
      pinType: "02",
      reserved1: "abc",
      reserved2: "",
      reserved3: "",
      reserved4: "",
      reserved5: "",
      reserved6: "",
      reserved7: "",
      reserved8: "",
      reserved9: "",
      reserved10: "",
    };

    console.log(data);
    let zindigiLog;
    try {
      zindigiLog = await zindigiLogServices.new(
        "jsblblbagentservices/v1/DebitPayment",
        data
      );
    } catch (err) {
      console.log(err);
    }
    Access_token = zindigiAccessTokens.DebitPayment;
    const options = {
      headers: { Access_token },
    };
    const res = await axios.post(
      `${process.env.ZINDGIBASEURL}jsblblbagentservices/v1/DebitPayment`,
      data,
      options
    );
    console.log(res.data);
    try {
      zindigiLogServices.updateResponse(zindigiLog._id, res.data);
    } catch (err) {
      console.log(err);
    }
    return res.data;
  },
};
module.exports = zindigiWalletServerices;
