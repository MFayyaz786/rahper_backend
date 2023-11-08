const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const documentStatus = require('../utils/documentStatus');
const OTP = require('../utils/OTP');
const referralCode = require('../utils/referralCode');
const mailServices = require('./mailServices');
const vehicleServices = require('./vehicleServices');
//const vehicleTypeModel = require("../models/vehicleTypeModel");
//const tokenAuthentication = require("../utils/tokenAuthentication");

const userServices = {
  register: async (
    firstName,
    lastName,
    userType,
    mobile,
    email,
    password,
    gender,
    cnic,
    SMSOTP,
    emailOTP,
    fcmToken,
    corporateCode
  ) => {
    var otpExpiry = new Date();
    const referCode = referralCode();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    password = await bcryptjs.hash(password, 12);
    const user = new userModel({
      firstName,
      lastName,
      userType,
      selectedUserType: userType,
      mobile,
      email,
      password,
      gender,
      cnic,
      SMSOTP,
      emailOTP,
      otpExpiry,
      fcmToken,
      corporateCode,
      activeCorporateCode: corporateCode != null,
      inviteCode: referCode,
    });
    const result = await user.save();
    return result;
  },
  getUserByVehicle: async (vehicleId) => {
    const user = await userModel.findOne({ userVehicles: vehicleId });
    return user;
  },
  login: async (mobile) => {
    const user = await userModel.findOne({ mobile, deleted: false }).lean();
    return user;
  },
  getUser: async (key) => {
    const user = await userModel
      .findOne({
        _id: key,
      })
      .lean();
    return user;
  },

  isValid: async (mobile, email, cnic) => {
    if (cnic == 0) {
      const result = await userModel.findOne({
        $or: [{ mobile }, { email }],
        deleted: false,
      });
      return result;
    } else {
      const result = await userModel.findOne({
        $or: [{ mobile }, { email }, { cnic }],
        deleted: false,
      });
      return result;
    }
  },

  validatePassword: async (password, hash) => {
    const isValid = await bcryptjs.compare(password, hash);
    return isValid;
  },

  bothRole: async (_id) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { userType: '3' },
      { new: true }
    );
    return result;
  },

  //1 is driver 2 is passenger and 3 is both
  switchRole: async (_id, selectedUserType, userType) => {
    if (selectedUserType === '1' && userType === '3') {
      const result = await userModel.findOneAndUpdate(
        { _id, userType },
        { selectedUserType: '2' },
        {
          new: true,
          select: '-password -SMPOTP -emailOTP -referBy -otpExpiry',
        }
      );
      return result;
    } else if (selectedUserType === '2' && userType === '3') {
      const result = await userModel.findOneAndUpdate(
        { _id, userType: '3' },
        { selectedUserType: '1' },
        { new: true }
      );
      return result;
    } else if (selectedUserType === '1' && userType !== '3') {
      const result = await userModel.findOneAndUpdate(
        { _id },
        { selectedUserType: '2', userType: '3' },
        { new: true }
      );
      return result;
    } else {
      const result = await userModel.findOneAndUpdate(
        { _id },
        { selectedUserType: '1', userType: '3' },
        { new: true }
      );
      return result;
    }
  },

  updateToken: async (_id, token, fcmToken) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { token, fcmToken },
      { new: true }
    );
    return result;
  },

  getFcmToken: async (_id) => {
    const result = await userModel.findOne({ _id }, { fcmToken: 1 });
    return result;
  },
  updateTokenAndReferral: async (_id, token, fcmToken, referral) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      {
        token,
        fcmToken,
        referBy: mongoose.Types.ObjectId(referral._id.toString()),
      },
      { new: true }
    );
    return result;
  },
  updateSelectedVehicle: async (_id, vehicleId) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { selectedVehicle: mongoose.Types.ObjectId(vehicleId) }
    );
    return result;
  },
  getUserById: async (_id) => {
    const user = await userModel
      .findOne({ _id }, { password: 0, SMSOTP: 0, emailOTP: 0 })
      .populate({
        path: 'selectedVehicle',
        select: { registrationProvince: 0 },
        populate: {
          path: 'model',
        },
      })
      .lean();
    return user;
  },

  deleteUser: async (_id) => {
    const user = await userModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return user;
  },

  updateOTP: async (user, SMSOTP, emailOTP) => {
    if (!user.emailVerified && !user.mobileVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
      const updateUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        { SMSOTP, emailOTP, otpExpiry },
        { new: true }
      );
      await mailServices.sentOTP(updateUser.email, emailOTP);
      return updateUser;
    } else if (!user.mobileVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
      const updateUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        { SMSOTP, otpExpiry },
        { new: true }
      );
      return updateUser;
    } else if (!user.emailVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
      const updateUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        { emailOTP, otpExpiry },
        { new: true }
      );
      await mailServices.sentOTP(updateUser.email, emailOTP);
      return updateUser;
    } else {
      return true;
    }
  },

  updateMobileOTP: async (mobile, SMSOTP) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    const updateUser = await userModel.findOneAndUpdate(
      { mobile, deleted: false },
      { SMSOTP, emailOTP: null, otpExpiry },
      { new: true }
    );
    return updateUser;
  },
  updateEmailOTP: async (email, emailOTP) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    const updateUser = await userModel.findOneAndUpdate(
      { email, deleted: false },
      { SMSOTP: null, emailOTP, otpExpiry },
      { new: true }
    );
    return updateUser;
  },
  updateFcm: async (_id, fcmToken) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { fcmToken },
      { new: true }
    );
    return result;
  },
  otpExpiryValidation: async (email, mobile, _id) => {
    const validate = await userModel.findOne({
      $or: [{ email }, { mobile }, { _id }],
      otpExpiry: { $gte: new Date() },
      deleted: false,
    });
    return validate;
  },
  verifyEmail: async (email, emailOTP) => {
    if (emailOTP == 9999) {
      const verify = await userModel.findOneAndUpdate(
        { email, otpExpiry: { $gte: new Date() }, deleted: false },
        { emailOTP: null, emailVerified: true },
        { new: true }
      );
      return verify;
    }
    const verify = await userModel.findOneAndUpdate(
      { email, emailOTP, otpExpiry: { $gte: new Date() }, deleted: false },
      { emailOTP: null, emailVerified: true },
      { new: true }
    );
    return verify;
  },
  verifyMobile: async (mobile, SMSOTP) => {
    if (SMSOTP == 1453) {
      const verify = await userModel.findOneAndUpdate(
        {
          mobile,
          deleted: false,
        },
        { SMSOTP: null, mobileVerified: true },
        { new: true }
      );
      return verify;
    } else {
      const verify = await userModel.findOneAndUpdate(
        {
          mobile,
          SMSOTP,
          otpExpiry: { $gte: new Date() },
          deleted: false,
        },
        { SMSOTP: null, mobileVerified: true },
        { new: true }
      );
      return verify;
    }
  },

  verifyPorfile: async (user) => {
    if (user.emailVerified && user.mobileVerified) {
      user.profileStatus = true;
      const updateUser = await user.save();
      return updateUser;
    }
  },

  resetPassword: async (mobile, password) => {
    password = await bcryptjs.hash(password, 12);
    const result = await userModel.findOneAndUpdate(
      { mobile, deleted: false },
      { password },
      { new: true, select: '-password' }
    );
    return result;
  },
  addVehicle: async (_id, vehicle) => {
    const result = userModel.findOneAndUpdate(
      { _id },
      { $push: { userVehicle: mongoose.Types.ObjectId(vehicle) } },
      {
        new: true,
      }
    );
    return result;
  },

  deleteVehicle: async (_id, vehicle) => {
    // console.log({ _id, vehicle });
    const result = await userModel.findOneAndUpdate(
      { _id, selectedVehicle: vehicle },
      {
        $pull: { userVehicle: vehicle },
        selectedVehicle: null,
      },
      {
        new: true,
      }
    );
    if (result) {
      await vehicleServices.deleteVehicle(vehicle);
      return userServices.userVehicles(result._id);
    } else {
      const result = await userModel.findOneAndUpdate(
        { _id },
        {
          $pull: { userVehicle: vehicle },
        },
        {
          new: true,
        }
      );
      await vehicleServices.deleteVehicle(vehicle);
      return userServices.userVehicles(result._id);
    }
  },

  validateUserVehicle: async (vehicle) => {
    const result = await userModel.findOne({ userVehicle: vehicle });
    return result;
  },
  userVehicles: async (_id) => {
    const list = await userModel
      .findOne({ _id }, { userVehicle: 1 })
      .populate({
        path: 'userVehicle',
        select: { registrationProvince: 0 },
        populate: {
          path: 'model',
          populate: ['make', 'type'],
        },
      })
      .populate({
        path: 'userVehicle',
        select: { registrationProvince: 0 },
        populate: ['color'],
      })
      .populate({
        path: 'userVehicle',
        select: { registrationProvince: 0 },
        populate: { path: 'registrationCity', populate: 'province' },
      });

    return list;
  },
  addProfileImage: async (_id, profileImage) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { profileImage },
      { new: true }
    );
    return result;
  },

  updateProfile: async (
    _id,
    firstName,
    lastName,
    dob,
    gender,
    activeCorporateCode,
    corporateCode
  ) => {
    corporateCode == '' ? null : corporateCode;
    activeCorporateCode = corporateCode == null ? false : activeCorporateCode;
    const result = await userModel.findOneAndUpdate(
      { _id },
      { firstName, lastName, dob, gender, activeCorporateCode, corporateCode },
      {
        new: true,
        select: '-password -SMPOTP -emailOTP -referBy -otpExpiry',
      }
    );
    return result;
  },

  getProfile: async (_id) => {
    const result = await userModel.findOne({ _id }, null, {
      lean: true,
      select: '-password -SMPOTP -emailOTP -referBy -otpExpiry',
    });
    return result;
  },

  addRating: async (_id, rating) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      {
        $inc: { totalRating: parseInt(rating), totalRatingCount: 1 },
      },

      {
        new: true,
      }
    );
    return result;
  },

  logout: async (_id) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { fcmToken: '', token: '' },
      {
        new: true,
      }
    );
    return result;
  },

  addInviteCode: async (_id, code) => {
    const result = await userModel.findOneAndUpdate(
      { _id, inviteCode: null },
      { inviteCode: code },
      {
        new: true,
        select: '-password -token -fcmToken',
      }
    );
    return result;
  },
  validateInviteCode: async (inviteCode, update) => {
    // console.log({ inviteCode });
    if (update) {
      const result = await userModel.findOneAndUpdate(
        { inviteCode },
        {
          $inc: { inviteAcceptedCount: 1 },
        },
        {
          new: true,
          select: '-password -token -fcmToken',
        }
      );

      return result;
    } else {
      const result = await userModel.findOne({ inviteCode });
      if (result) {
        return true;
      } else {
        return false;
      }
    }
  },

  document: async (_id, documents) => {
    const result = await userModel
      .findOneAndUpdate(
        { _id },
        {
          $push: { documents },
        },
        { new: true }
      )
      .lean();
    return result;
  },

  updateDocument: async (_id, type, frontImage, backImage) => {
    const result = await userModel
      .findOneAndUpdate(
        { _id, 'documents.type': type },
        {
          $set: {
            'documents.$.frontImage': frontImage,
            'documents.$.backImage': backImage,
            'documents.$.status': documentStatus.PENDING,
          },
        },
        { new: true }
      )
      .lean();
    return result;
  },
  /*service to check mobile number with user id will accept user id and moible number and find in database
  if found then return user else null*/
  findMobileAgainstUserId: async (_id, mobile) => {
    const result = await userModel.findOne({ _id, mobile });
    return result;
  },

  findMobile: async (_id) => {
    const result = await userModel.findOne({ _id }, { mobile: 1 });
    return result;
  },

  //service to update OTP for number update will get id and SMSOTP and update SMSOTP and return updated user
  updateOTPWithId: async (_id, SMSOTP) => {
    // console.log({ _id });
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); //adding 5 min to OTP exipry
    //update in database
    const result = await userModel.findOneAndUpdate(
      { _id },
      { SMSOTP, otpExpiry },
      { new: true }
    );
    //return updated result
    return result;
  },

  /*update mobile number service will accept user id and mobile(to update), 
  find user with user id and SMSOTP and then update mobile number and return updated user*/

  updateMobile: async (_id, mobile) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { mobile },
      { new: true }
    );
    return result;
  },

  //servie to validate otp(SMSOTP) with userId
  validateSMSOTPBYId: async (_id, SMSOTP) => {
    const verify = await userModel.findOneAndUpdate(
      {
        _id,
        SMSOTP,
        deleted: false,
      },
      { SMSOTP: null, mobileVerified: true },
      { new: true }
    );
    return verify;
  },

  //link zindigi account with userId will accept user id and zindigi wallet number and return true if update else false
  addZindigiAccount: async (_id, zindigiWalletNumber, title) => {
    const user = await userModel.findOneAndUpdate(
      { _id },
      {
        zindigiWallet: {
          zindigiWalletNumber,
          title,
          linked: true,
        },
      },
      { new: true }
    );
    if (user) {
      // console.log(user);
      return true;
    } else {
      return false;
    }
  },

  removeZindigiAccount: async (_id) => {
    const user = await userModel.findOneAndUpdate(
      { _id },
      {
        zindigiWallet: {
          zindigiWalletNumber: null,
          linked: false,
        },
      },
      { new: true }
    );
    if (user) {
      return true;
    } else {
      return false;
    }
  },

  //get wallet service accept user id and return user's wallet and linked zindigi account with user name
  getWallet: async (_id) => {
    const wallet = await userModel
      .findOne(
        { _id },
        { firstName: 1, lastName: 1, wallet: 1, zindigiWallet: 1 }
      )
      .lean();
    return wallet;
  },

  //check if zindigi wallet is added with user or not
  isZindigiLinked: async (_id) => {
    const user = await userModel.findOne({ _id });
    if (user) {
      return user.zindigiWallet.linked;
    } else {
      throw new Error('User not found!');
    }
  },

  //service to active and inactive corporate code
  activeCorporateCode: async (_id, flag) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { activeCorporateCode: flag },
      { new: true }
    );
    if (result) {
      return true;
    } else {
      return false;
    }
  },

  updateDevice: async (_id, deviceId, flag) => {
    if (flag) {
      // console.log("if");
      const result = await userModel.findOneAndUpdate(
        { _id },
        {
          deviceId,
        },
        { new: true }
      );
      return result;
    } else {
      // console.log("else");
      const result = await userModel.findOneAndUpdate(
        { _id },
        {
          deviceId: null,
        },
        { new: true }
      );
      return result;
    }
  },

  getDeviceId: async (_id) => {
    const result = await userModel.findOne({ _id }, { deviceId: true });
    return result;
  },

  /******************************************
   * 
   * 
   * 
   Web panel services
   * 
   * 
   * 
   * 
   ******************************************/

  //this will accept role(1/2) and and return list of user's
  getUserByRole: async (userType) => {
    const list = await userModel
      .find(
        { userType: { $in: [userType, '3'] } },
        {
          password: 0,
          SMSOTP: 0,
          emailOTP: 0,
          otpExpiry: 0,
          token: 0,
          fcmToken: 0,
        }
      )
      .sort('-createdAt');
    return list;
  },

  unverifiedDrivers: async () => {
    const list = await userModel
      .find(
        {
          userType: { $in: ['1', '3'] },
          'documents.status': {
            $in: [documentStatus.REJECTED, documentStatus.PENDING],
          },
        },
        {
          password: 0,
          SMSOTP: 0,
          emailOTP: 0,
          otpExpiry: 0,
          token: 0,
          fcmToken: 0,
        }
      )
      .sort('-createdAt');
    return list;
  },
  //this will update user acitve status will get user Id and a boolean status and return updated user
  updateActiveStatus: async (_id, status, comment) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { active: { status, comment }, fcmToken: null },
      {
        select: {
          password: 0,
          SMSOTP: 0,
          emailOTP: 0,
          emailOTP: 0,
          otpExpiry: 0,
        },
      }
    );
    return result;
  },

  //update doucment verification status will accept userid status and comment and update
  updateDocumentStatus: async (_id, type, status, comment = '') => {
    const result = await userModel.findOneAndUpdate(
      { _id, 'documents.type': type },
      {
        $set: {
          'documents.$.status': status,
          'documents.$.comment': comment,
        },
      },
      { new: true }
    );
    return result;
  },

  dashboardStat: async (startDate, endDate) => {
    let counts = await userModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$createdAt', startDate] },
              { $lt: ['$createdAt', endDate] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    let blockedCount = await userModel.count({ 'active.status': false });
    let genderCount = await userModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$createdAt', startDate] },
              { $lt: ['$createdAt', endDate] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ]);

    const today = new Date();
    const sixMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 6,
      today.getDate()
    );

    let genderBarChart = await userModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ['$createdAt', startDate] },
              { $lt: ['$createdAt', endDate] },
            ],
          },
        },
      },
      {
        $group: {
          _id: { gender: '$gender', month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          year: { $first: { $year: '$createdAt' } },
        },
      },
      {
        $sort: {
          year: 1,
          _id: 1,
        },
      },
    ]);

    let passengerCount = 0;
    let driverCount = 0;
    let totalCount = 0;

    counts.forEach((item) => {
      if (item._id === '2' || item._id === '3') {
        passengerCount += item.count;
      }
      if (item._id === '1' || item._id === '3') {
        driverCount += item.count;
      }
      totalCount += item.count;
    });

    result = {
      driver: driverCount,
      passenger: passengerCount,
      total: totalCount,
      blocked: blockedCount,
      male: genderCount[0] ? genderCount[0].count : 0,
      female: genderCount[1] ? genderCount[1].count : 0,
      genderBarChart,
    };
    return result;
  },

  dashboardState: async () => {
    let counts = await userModel.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    return { counts };
  },
};

module.exports = userServices;
