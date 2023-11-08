const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const smsServices = require("../services/smsServices");
const userServices = require("../services/userServices");
const zindigiWalletServerices = require("../services/zindigiWalletServices");
const convertMobileFormate = require("../utils/convertMobileFormate");

const OTP = require("../utils/OTP");
const zindigiWalletRouter = express.Router();
zindigiWalletRouter.post(
  "/verifyAccountToLink",
  expressAsyncHandler(async (req, res) => {
    let { cnic, mobileNo, dateTime } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.verifyAccountToLink(
      cnic,
      mobileNo,
      dateTime
    );
    if (result.responseCode == "00") {
      res.status(200).send({ msg: "OTP sent to your mobile" });
    } else if (result.responseCode == "14") {
      res.status(403).send({ msg: result.responseDetails[0] });
    } else {
      if (result.responseCode == "67") {
        res.status(400).send({
          msg: "This mobile number is registered against an other CNIC!",
        });
        return;
      } else if (result.responseCode == "70") {
        res.status(400).send({
          msg: "This CNIC is registered against an other mobile number!",
        });
        return;
      }
      res.status(400).send({ msg: result.responseDetails[0] });
    }
  })
);

zindigiWalletRouter.post(
  "/linkAccount",

  expressAsyncHandler(async (req, res) => {
    let { userId, dateTime, mobileNo, cnic, otpPin } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    // console.log(req.body);
    const result = await zindigiWalletServerices.linkAccount(
      dateTime,
      mobileNo,
      cnic,
      otpPin
    );
    if (result.responseCode == "00") {
      // const otpExpiryValidation = await userServices.otpExpiryValidation(
      //   null,
      //   null,
      //   userId
      // );
      // if (otpExpiryValidation) {
      //   //validating OTP with user id
      //   const validateSMSOTPBYId = await userServices.validateSMSOTPBYId(
      //     userId,
      //     otpPin
      //   );
      //   if (validateSMSOTPBYId) {
      const linkZindigiAccount = await userServices.addZindigiAccount(
        userId,
        mobileNo,
        result.accountTitle
      );
      if (linkZindigiAccount) {
        res.status(200).send({
          msg: "Your Zindigi wallet account has been linked!",
          data: linkZindigiAccount,
        });
      } else {
        res.status(400).send({ msg: "Failed to link account with user" });
      }
      // } else {
      //   res.status(403).send(({ msg: "Invalid OTP!" }));
      // }
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }

    // } else {
    //   res.status(403).send({ msg: result.responseDetails[0] });
    // }
  })
);

zindigiWalletRouter.post(
  "/payment",
  expressAsyncHandler(async (req, res) => {
    let { mobileNumber, otp, amount, dateTime } = req.body;
    const result = await zindigiWalletServerices.payment(
      dateTime,
      mobileNumber,
      otp,
      amount
    );
    return res.send(result);
  })
);

zindigiWalletRouter.post(
  "/paymentInquiry",
  expressAsyncHandler(async (req, res) => {
    let { mobileNumber, amount, dateTime } = req.body;
    const result = await zindigiWalletServerices.paymentInquiry(
      dateTime,
      mobileNumber,
      amount
    );
    return res.send(result);
  })
);

zindigiWalletRouter.post(
  "/accountOpening",
  expressAsyncHandler(async (req, res) => {
    let { dateTime, cnic, cnicIssuanceDate, mobileNo, mobileNetwork, emailId } =
      req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.accountOpening(
      dateTime,
      cnic,
      cnicIssuanceDate,
      mobileNo,
      mobileNetwork,
      emailId
    );
    // console.log(result);
    if (result.responseCode == "14") {
      res.status(400).send({ msg: result.responseDetails[0] });
    } else if (result.responseCode == "00") {
      res
        .status(200)
        .send({ msg: "Your zindigi account created successfully!" });
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }
  })
);
zindigiWalletRouter.post(
  "/generateOTPAccOpening",

  expressAsyncHandler(async (req, res) => {
    let { cnic, mobileNo, dateTime } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.generateOTPAccOpening(
      cnic,
      mobileNo,
      dateTime
    );
    // console.log(result);
    if (result.responseCode == "00") {
      res.status(200).send({ msg: "OTP sent to your mobile", data: result });
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }
  })
);
zindigiWalletRouter.post(
  "/verifyOTPAccOpening",

  expressAsyncHandler(async (req, res) => {
    let { userId, dateTime, cnic, mobileNo, otpPin } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.verifyOTPAccOpening(
      dateTime,
      cnic,
      mobileNo,
      otpPin
    );
    // console.log(result);
    if (result.responseCode == "00") {
      const linkZindigiAccount = await userServices.addZindigiAccount(
        userId,
        mobileNo
      );
      if (linkZindigiAccount) {
        res.status(200).send({ msg: "Zindigi wallet linked!", data: result });
      } else {
        res.status(400).send({ msg: "Failed to link account with user" });
      }
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }
  })
);
zindigiWalletRouter.post(
  "/generateMPIN",

  expressAsyncHandler(async (req, res) => {
    let { dateTime, mobileNo, mPin, confirmMpin } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.generateMPIN(
      dateTime,
      mobileNo,
      mPin,
      confirmMpin
    );
    // console.log(result);
    if (result.responseCode == "00") {
      res.status(200).send({ msg: "MPIN created successfully", data: result });
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }
  })
);
zindigiWalletRouter.post(
  "/balanceInquiry",

  expressAsyncHandler(async (req, res) => {
    let { dateTime, mobileNo, otpPin } = req.body;
    mobileNo = convertMobileFormate(mobileNo);
    const result = await zindigiWalletServerices.balanceInquiry(
      dateTime,
      mobileNo,
      otpPin
    );
    if (result.responseCode == "00") {
      res.status(200).send({ msg: "Balance Details", data: result });
    } else {
      res.status(403).send({ msg: result.responseDetails[0] });
    }
  })
);
module.exports = zindigiWalletRouter;
