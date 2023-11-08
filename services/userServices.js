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
    corporateCode,
    device
  ) => {
    console.log({ device });
    var otpExpiry = new Date();
    const referCode = referralCode();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
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
      signupDevice: device,
      loginDevice: device,
      signupAs: userType,
    });
    const result = await user.save();
    return result;
  },
  getUserByVehicle: async (vehicleId) => {
    const user = await userModel.findOne({ userVehicle: vehicleId });
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
  getUserById: async (_id, flag) => {
    if (flag == 'forPanel') {
      //for panel
      const user = await userModel
        .findOne({ _id }, { password: 0, SMSOTP: 0, emailOTP: 0 })
        .populate({
          path: 'selectedVehicle',
          select: { registrationProvince: 0 },
          populate: {
            path: 'model',
          },
        })
        .populate({
          path: 'userVehicle',
        })
        .lean();
      return user;
    }
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
      { deleted: true, },
      { new: true }
    );
    return user;
  },

  updateOTP: async (user, SMSOTP, emailOTP) => {
    if (!user.emailVerified && !user.mobileVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
      const updateUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        { SMSOTP, emailOTP, otpExpiry },
        { new: true }
      );
      await mailServices.sentOTP(updateUser.email, emailOTP);
      return updateUser;
    } else if (!user.mobileVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
      const updateUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        { SMSOTP, otpExpiry },
        { new: true }
      );
      return updateUser;
    } else if (!user.emailVerified) {
      var otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
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
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
    const updateUser = await userModel.findOneAndUpdate(
      { mobile, deleted: false },
      { SMSOTP, emailOTP: null, otpExpiry },
      { new: true }
    );
    return updateUser;
  },
  updateEmailOTP: async (email, emailOTP) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
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
      return await userServices.userVehicles(result._id);
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
      return await userServices.userVehicles(result._id);
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
    corporateCode,
    smsSource
  ) => {
    corporateCode == '' ? null : corporateCode;
    activeCorporateCode = corporateCode == null ? false : activeCorporateCode;
    const result = await userModel.findOneAndUpdate(
      { _id },
      {
        firstName,
        lastName,
        dob,
        gender,
        activeCorporateCode,
        corporateCode,
        smsSource,
      },
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
  userDocuments: async (_id) => {
    const result = await userModel
      .findOne(
        { _id },
        {
          'documents.type': 1,
          'documents.frontImage': 1,
          'documents.backImage': 1,
          'documents.comment': 1,
          'documents.status': 1,
        }
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
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 2); //adding 5 min to OTP exipry
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

  updateDevice: async (_id, deviceId, flag, device) => {
    if (flag) {
      // console.log("if");
      const result = await userModel.findOneAndUpdate(
        { _id },
        {
          deviceId,
          loginDevice: device,
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
  getUserByRole: async (userType, pageNumber = 0, text) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    if (text) {
      if (userType == 'all'){
        const list = await userModel
          .find(
            { $text: { $search: text } },
            {
              password: 0,
              SMSOTP: 0,
              emailOTP: 0,
              otpExpiry: 0,
              token: 0,
              fcmToken: 0,
            }
          )
          .skip(skip)
          .limit(pageSize)
          .sort("-createdAt");
        return list;
      }
      const list = await userModel
        .find(
          {
           userType: { $in: [userType, '3'] },
           $text: { $search: text }
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
        .skip(skip)
        .limit(pageSize)
        .sort('-createdAt');
      return list;
    } else {
      if (userType == 'all') {
        const list = await userModel
          .find(
            {},
            {
              password: 0,
              SMSOTP: 0,
              emailOTP: 0,
              otpExpiry: 0,
              token: 0,
              fcmToken: 0,
            }
          )
          .skip(skip)
          .limit(pageSize)
          .sort('-createdAt');
        return list;
      }
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
        .skip(skip)
        .limit(pageSize)
        .sort('-createdAt');
      return list;
    }
  },

  countByRole: async (userType, text) => {
    if (text) {
      if (userType == 'all') {
        const count = await userModel.count({ $text: { $search: text } });
        return count;
      }
      const count = await userModel.count({
        userType: { $in: [userType, '3'] },
        $text: { $search: text },
      });
      return count;
    } else {
      if (userType == 'all') {
        const count = await userModel.count({});
        return count;
      }
      const count = await userModel.count({
        userType: { $in: [userType, '3'] },
      });
      return count;
    }
  },

  getBlockedUser: async (pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    const list = await userModel
      .find(
        { 'active.status': false },
        {
          password: 0,
          SMSOTP: 0,
          emailOTP: 0,
          otpExpiry: 0,
          token: 0,
          fcmToken: 0,
        }
      )
      .skip(skip)
      .limit(pageSize)
      .sort('-createdAt');
    return list;
  },

  countBlockedUser: async () => {
    const count = await userModel.count({ 'active.status': false });
    return count;
  },

  unverifiedDrivers: async (pageNumber = 0, flag) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    if (flag == 'verified') {
      const list = await userModel
        .find(
          {
            userType: { $in: ['1', '3'] },
            'documents.status': {
              $in: [documentStatus.VERIFIED],
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
        .sort('-createdAt')
        .skip(skip)
        .limit(pageSize);
      return list;
    } else if (flag == 'other') {
      const list = await userModel
        .find(
          {
            userType: { $in: ['1', '3'] },
            'documents.status': {
              $nin: [
                documentStatus.VERIFIED,
                documentStatus.PENDING,
                documentStatus.REJECTED,
              ],
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
        .sort('-createdAt')
        .skip(skip)
        .limit(pageSize);
      return list;
    }
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
      .sort('-createdAt')
      .skip(skip)
      .limit(pageSize);
    return list;
  },

  unverifiedDriversCount: async () => {
    const count = await userModel.count({
      userType: { $in: ['1', '3'] },
      'documents.status': {
        $in: [documentStatus.REJECTED, documentStatus.PENDING],
      },
    });

    return count;
  },

  verifiedDrivers: async (pageNumber = 0) => {
    pageNumber = parseInt(pageNumber) + 1;
    const pageSize = 50; // Specify the number of documents per page
    const skip = (pageNumber - 1) * pageSize;
    const list = await userModel
      .find(
        {
          userType: { $in: ['1', '3'] },
          'documents.status': {
            $in: [documentStatus.VERIFIED],
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
      .sort('-createdAt')
      .skip(skip)
      .limit(pageSize);
    return list;
  },

  unverifiedDriversCount: async (flag) => {
    if (flag == 'verified') {
      const count = await userModel.count({
        userType: { $in: ['1', '3'] },
        'documents.status': {
          $in: [documentStatus.VERIFIED],
        },
      });
      return count;
    } else if (flag == 'other') {
      const count = await userModel.count({
        userType: { $in: ['1', '3'] },
        'documents.status': {
          $nin: [
            documentStatus.VERIFIED,
            documentStatus.PENDING,
            documentStatus.REJECTED,
          ],
        },
      });
      return count;
    }
    const count = await userModel.count({
      userType: { $in: ['1', '3'] },
      'documents.status': {
        $in: [documentStatus.REJECTED, documentStatus.PENDING],
      },
    });
    return count;
  },

  verifiedDriversCount: async () => {
    const count = await userModel.count({
      userType: { $in: ['1', '3'] },
      'documents.status': {
        $in: [documentStatus.VERIFIED],
      },
    });

    return count;
  },
  //this will update user acitve status will get user Id and a boolean status and return updated user
  updateActiveStatus: async (_id, status, comment) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      { active: { status, comment },
     // fcmToken: null 
    },
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

  getMatchAndRequestStatus: async (_id) => {
    const result = await userModel.findOne(
      { _id },
      {
        anyRequestAsDriver: 1,
        anyRequestAsPassenger: 1,
        anyMatchAsDriver: 1,
        anyMatchAsPassenger: 1,
      }
    );
    return result;
  },

  updateMatchAndRequestStatus: async (_id, flag, userType, status) => {
    if (userType == 1) {
      if (flag == 'request') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyRequestAsDriver: status,
          },
          { new: true }
        );
        console.log("result: ", result);
        return result;
      } else if (flag == 'match') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyMatchAsDriver: status,
          },
          { new: true }
        );
        return result;
      } else if (flag == 'all') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyMatchAsDriver: status,
            anyRequestAsDriver: status,
          },
          { new: true }
        );
        console.log("result:for all driver ", result);
        return result;
      } else {
        res.status(400).send({ msg: 'Invalid flag' });
      }
    } else if (userType == 2) {
      if (flag == 'request') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyRequestAsPassenger: status,
          },
          { new: true }
        );
        console.log("result: for user ", result);
        return result;
      } else if (flag == 'match') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyMatchAsPassenger: status,
          },
          { new: true }
        );
        return result;
      } else if (flag == 'all') {
        const result = await userModel.findOneAndUpdate(
          { _id },
          {
            anyMatchAsPassenger: status,
            anyRequestAsPassenger: status,
          },
          { new: true }
        );
        return result;
      } else {
        res.status(400).send({ msg: 'Invalid flag' });
      }
    } else {
      res.status(400).send({ msg: 'Invalid user type' });
    }
  },

  dashboardStat: async () => {
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
    let blockedCount = await userModel.count({ 'active.status': false });
    let genderCount = await userModel.aggregate([
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
console.log("count",count)
    // let genderBarChart = await userModel.aggregate([
    //   {
    //     $group: {
    //       _id: { gender: "$gender", createdAt: { $month: "$createdAt" } },
    //       count: { $sum: 1 },
    //     },
    //   },
    //   {
    //     $sort: {
    //       _id: 1,
    //     },
    //   },
    // ]);

    const today = new Date();
    const sixMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 6,
      today.getDate()
    );

    let genderBarChart = await userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
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

    console.log("counts: ", counts);
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

  // dashboardStat: async () => {
  //   let typeCount = await userModel.aggregate([
  //     {
  //       $group: {
  //         _id: "$userType",
  //         count: { $sum: 1 },
  //       },
  //     },
  //     {
  //       $sort: {
  //         _id: 1,
  //       },
  //     },
  //   ]);
  //   let passenger = typeCount[1].count + typeCount[2].count;
  //   let owner = typeCount[0].count + typeCount[2].count;
  //   var total = passenger + owner;
  //   var user = {
  //     total: total,
  //     passenger,
  //     owner,
  //   };

  //   let blockedCount = await userModel.count({ "active.status": false });
  //   var blockedUser = {
  //     totalBlock: blockedCount,
  //   };
  //   let genderCount = await userModel.aggregate([
  //     {
  //       $group: {
  //         _id: { gender: "$gender", createdAt: { $month: "$createdAt" } },
  //         count: { $sum: 1 },
  //       },
  //     },
  //     {
  //       $sort: {
  //         _id: -1,
  //       },
  //     },
  //   ]);

  //   // counts = [
  //   //   { _id: "driver", count: counts[0].count + counts[2].count },
  //   //   { _id: "passenger", count: counts[1].count + counts[2].count },
  //   //   { _id: "blocked", blockedCount },
  //   // ];
  //   return { user, blockedUser, genderCount };
  // },
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
    // console.log(counts);
    // let blockedCount = await userModel.count({ "active.status": false });
    // let genderCount = await userModel.aggregate([
    //   {
    //     $group: {
    //       _id: "$gender",
    //       count: { $sum: 1 },
    //     },
    //   },
    //   {
    //     $sort: {
    //       _id: -1,
    //     },
    //   },
    // ]);
    // counts = [
    //   { _id: "driver", count: counts[0].count + counts[2].count },
    //   { _id: "passenger", count: counts[1].count + counts[2].count },
    //   { _id: "blocked", blockedCount },
    // ];
    return { counts };
  },
  getReferAndReferBy: async () => {
    const result = await userModel.aggregate([
      {
        $match: {
          referBy: {
            $ne: null,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referBy',
          foreignField: '_id',
          as: 'referBy',
        },
      },
      {
        $unwind: {
          path: '$referBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user: {
            userId: '$_id',
            profileImage: '$profileImage',
            firstName: '$firstName',
            lastName: '$lastName',
            signupAs: '$signupAs',
            currentRole: '$userType',
            signupDevice: '$signupDevice',
            createdAt: '$createdAt',
          },
          referBy: {
            referById: '$referBy._id',
            profileImage: '$profileImage',
            firstName: '$referBy.firstName',
            lastName: '$referBy.lastName',
            inviteCode: '$referBy.inviteCode',
          },
        },
      },
      {
        $group: {
          _id: '$referBy',
          users: {
            $push: '$user',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          referBy: '$_id',
          users: '$users',
          total: '$count',
        },
      },
    ]);
    return result;
  },
};

module.exports = userServices;
