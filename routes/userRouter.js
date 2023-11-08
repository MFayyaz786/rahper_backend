const express = require('express');
const userRouter = express.Router();
const asyncHandler = require('express-async-handler');
const mailServices = require('../services/mailServices');
const userServices = require('../services/userServices');
const OTP = require('../utils/OTP');
const token = require('../utils/token');
const { v4: uuidv4 } = require('uuid');
const authIdServices = require('../services/authIdServices');
const jwtServices = require('../utils/jwtServices');
const uploadFile = require('../utils/uploadFile');
const driverRouteServices = require('../services/driverRouteServices');
const scheduleRideServices = require('../services/scheduleRideServices');
const referralCode = require('../utils/referralCode');
const smsServices = require('../services/smsServices');
const userTypes = require('../utils/userTypes');
const documentStatus = require('../utils/documentStatus');

const expressAsyncHandler = require('express-async-handler');
const zindigiWalletServerices = require('../services/zindigiWalletServices');
const paymentGatewayServices = require('../services/paymentGatewayServices');
const { getUserSockets } = require('../utils/userSocketId');
const corporateServices = require('../services/corporateServices');
const userWalletServices = require('../services/userWalletServices');
const decryptData = require('../utils/decryptData');
const encryptData = require('../utils/encryptData');
const notificationServices = require('../services/notifcationServices');

//user register api
userRouter.post(
  '/register',

  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      userType,
      mobile,
      email,
      password,
      gender,
      cnic,
      fcmToken,
      inviteCode,
      corporateCode,
      deviceId,
      device,
    } = req.body;
    if (corporateCode) {
      const isValidCorporateCode = await corporateServices.findByCode(
        corporateCode
      );
      if (!isValidCorporateCode) {
        res.status(400).send({ msg: 'Invalid corporate code!' });
        return;
      }
    }

    const isValid = await userServices.isValid(mobile, email, cnic);
    var validateInvitation = null;
    inviteCode &&
      (validateInvitation = await userServices.validateInviteCode(
        inviteCode,
        false
      ));
    if (!validateInvitation && inviteCode) {
      res.status(400).send({ msg: 'Invalid invite code!' });
      return;
    }

    // if (inviteCode !== "RHPR-081522") {
    //   res.status(400).send({
    //     msg: "This is a beta version please provide valid invite code",
    //   });
    // }
    else if (!isValid) {
      const SMSOTP = OTP();
      const emailOTP = OTP();
      const user = await userServices.register(
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
      );
      if (user) {
        userWalletServices.newWallet(user._id.toString());
        if (userType == 1) {
          Promise.all([
            mailServices.sentOTP(email, emailOTP),
            smsServices.sendSMS(user.mobile, new Date(), SMSOTP),
          ]);
        } else {
          Promise.all([
            // mailServices.sentOTP(email, emailOTP),
            smsServices.sendSMS(user.mobile, new Date(), SMSOTP),
          ]);
        }
        let referBy = null;
        inviteCode &&
          (referBy = await userServices.validateInviteCode(inviteCode, true));
        const uuid = uuidv4();
        const refreshToken = jwtServices.create({ uuid, type: 'user' });
        const userToken = jwtServices.create(
          { userId: user._id, type: 'user' },
          '5m'
        );
        authIdServices.add(user._id, uuid);
        if (referBy) {
          const [result] = await Promise.all([
            userServices.updateTokenAndReferral(
              user._id,
              userToken,
              fcmToken,
              referBy
            ),
            userServices.updateDevice(user._id, deviceId, true),
          ]);
          res.status(201).send({
            msg: 'User registered',
            data: result,
            accessToken: userToken,
            refreshToken,
          });

          // const result = await userServices.updateTokenAndReferral(
          //   user._id,
          //   userToken,
          //   fcmToken,
          //   referBy
          // );
        } else {
          const [result] = await Promise.all([
            userServices.updateToken(user._id, userToken, fcmToken),
            userServices.updateDevice(user._id, deviceId, true),
          ]);
          res.status(201).send({
            msg: 'User registered',
            data: result,
            accessToken: userToken,
            refreshToken,
          });
        }
      } else {
        res.status(422).send({ msg: 'User not register' });
      }
    } else {
      res
        .status(409)
        .send({ msg: 'User with email, phone or cnic already registered' });
    }
  })
);

userRouter.post(
  '/refreshToken',
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    const { refreshToken } = req.body;
    const verifyToken = jwtServices.authenticate(refreshToken);
    if (verifyToken) {
      const { uuid, type } = verifyToken;
      const AuthId = await authIdServices.findByUUID(uuid);
      if (AuthId) {
        const { userId } = AuthId;
        if (userId) {
          const accessToken = jwtServices.create({ userId, type }, '5m');
          res.status(200).send(encryptData({ msg: '', data: { accessToken } }));
        } else {
          res.status(401).send({ msg: 'Login please' });
        }
      } else {
        res.status(401).send({ msg: 'Login please' });
      }
    } else {
      res.status(401).send({ msg: 'Login please' });
    }
  })
);

//user login api
userRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    // console.log(req.body);
    const { fcmToken, mobile, password, deviceId, device} = req.body;
    const user = await userServices.login(mobile);
    if (user) {
      // if (user.active.status) {
      const comparePassword = await userServices.validatePassword(
        password,
        user.password
      );
      if (comparePassword) {
        const uuid = uuidv4();
        const refreshToken = jwtServices.create({ uuid, type: 'user' });
        const userToken = jwtServices.create(
          { userId: user._id, type: 'user' },
          '5m'
        );
        authIdServices.add(user._id, uuid);
        const [result] = await Promise.all([
          userServices.updateDevice(user._id, deviceId, true, device),
          userServices.updateToken(user._id, userToken, fcmToken),
        ]);
        const userSockets = getUserSockets(user._id.toString());
        const socket = req.app.get('socket');
        userSockets.forEach((item) => {
          socket
            .to(item.socketId)
            .emit('deviceUpdate', JSON.stringify(encryptData({ deviceId })));
        });
        // if (user?.userType == 1 || user?.userType == 3) {
        //   if (!user?.emailVerified) {
        //     const emailOTP = OTP();
        //     const updateEmailOTP = await userServices.updateEmailOTP(
        //       user?.email,
        //       emailOTP
        //     );
        //     if (updateEmailOTP) {
        //       await mailServices.sentOTP(user.email, emailOTP);
        //     }
        //   }
        //   if (!user?.mobileVerified) {
        //     const SMSOTP = OTP();
        //     const updateMobileOTP = await userServices.updateMobileOTP(
        //       user?.mobile,
        //       SMSOTP
        //     );
        //     if (updateMobileOTP) {
        //       await smsServices.sendSMS(
        //         user?.mobile,
        //         new Date(),
        //         SMSOTP,
        //         smsSource
        //       );
        //     }
        //   }
        // }
        delete user.password;
        delete user.SMSOTP;
        delete user.emailOTP;
        delete user.referBy;
        delete user.OTPExpiry;

        res.status(200).send({
          msg: 'User login',
          data: result,
          accessToken: userToken,
          refreshToken,
        });
      } else {
        res.status(401).send({ msg: 'Invalid Credentials!' });
      }
    } else {
      res.status(401).send({ msg: 'Invalid Credentials!' });
    }
  })
);

//switch mode
userRouter.post(
  '/switch',

  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await userServices.getUserById(userId);
    if (user.selectedUserType == 1) {
      const isActiveRide = await driverRouteServices.anyActiveRide(userId);
      if (isActiveRide) {
        res.status(400).send({ msg: 'Please finish your ride first!' });
        return;
      }
    }
    if (
      user.documentUpload == true &&
      user.selectedUserType == 2 &&
      user.documentVerified.status == documentStatus.PENDING
    ) {
      res.status(401).send({ msg: user.documentVerified.comment });
    } else {
      const result = await userServices.switchRole(
        userId,
        user.selectedUserType,
        user.userType
      );
      if (result) {
        if (result.emailVerified) {
          res.status(200).send({ msg: 'Role switched!', data: result });
        } else {
          const emailOTP = OTP();
          await userServices.updateEmailOTP(result.email, emailOTP);
          res.status(200).send({ msg: 'Role switched!', data: result });
          await mailServices.sentOTP(result.email, emailOTP);
        }
      } else {
        // console.log("outer else");
        res.status(400).send({ msg: 'Role not switched!' });
      }
    }
  })
);

//email verification api

userRouter.post(
  '/verifyemail',

  asyncHandler(async (req, res) => {
    const { email, emailOTP } = req.body;
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      email,
      null,
      null
    );
    if (otpExpiryValidation) {
      const verifyEmail = await userServices.verifyEmail(email, emailOTP);
      if (verifyEmail) {
        if (!verifyEmail.profileStatus) {
          await userServices.verifyPorfile(verifyEmail);
        }
        res.status(202).send({ msg: 'Email verified' });
      } else {
        res.status(400).send({ msg: 'Invalid OTP' });
      }
    } else {
      res.status(400).send({ msg: 'OTP has expired' });
    }
  })
);

//mobile verify api
userRouter.post(
  '/verifymobile',

  asyncHandler(async (req, res) => {
    const { mobile, mobileOTP } = req.body;
    console.log(mobile);
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      null,
      mobile,
      null
    );
    if (otpExpiryValidation) {
      const verifyMobile = await userServices.verifyMobile(mobile, mobileOTP);
      if (verifyMobile) {
        if (!verifyMobile.profileStatus) {
          await userServices.verifyPorfile(verifyMobile);
        }
        res.status(202).send({ msg: 'Mobile verified' });
      } else {
        res.status(400).send({ msg: 'Invalid OTP' });
      }
    } else {
      res.status(400).send({ msg: 'OTP has expired' });
    }
  })
);

//get user by id
userRouter.post(
  '/userbyid',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await userServices.getUserById(userId);
    if (user) {
      delete user.password;
      delete user.SMPOTP;
      delete user.emailOTP;
      delete user.referBy;
      delete user.OTPExpiry;
      res.status(200).send({ msg: 'User found', data: user });
    } else {
      res.status(400).send({ msg: 'User not found' });
    }
  })
);

//reset password api
userRouter.post(
  '/resetpassword',
  asyncHandler(async (req, res) => {
    const { mobile, password } = req.body;
    const result = await userServices.resetPassword(mobile, password);
    if (result) {
      res.status(200).send({ msg: 'Password reset!' });
    } else {
      res.status(400).send({ msg: 'Oops password reset failed!' });
    }
  })
);

//request a new otp api
userRouter.post(
  '/otprequest',

  asyncHandler(async (req, res) => {
    const { mobile, email, smsSource } = req.body;
    //for mobile
    console.log(req.body);
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      email,
      mobile,
      null
    );
    if (otpExpiryValidation && false) {
      res.status(400).send({ msg: 'Retry after few minutes' });
    } else {
      if (mobile) {
        const SMSOTP = OTP();
        const result = await userServices.updateMobileOTP(mobile, SMSOTP);
        if (result) {
          await smsServices.sendSMS(
            result.mobile,
            new Date(),
            SMSOTP,
            smsSource
          );
          res.status(200).send({ msg: 'OTP sent to your mobile' });
        } else {
          res.status(400).send({ msg: 'Mobile number not registered!' });
        }
        //for email
      } else if (email) {
        const emailOTP = OTP();
        const result = await userServices.updateEmailOTP(email, emailOTP);
        if (result) {
          await mailServices.sentOTP(result.email, emailOTP);
          res.status(200).send({ msg: 'OTP sent to your email' });
        } else {
          res.status(400).send({ msg: 'Email not registered!' });
        }
      } else {
        res.status(400).send({ msg: 'Provide mobile number or email!' });
      }
    }
  })
);

//generate otp on email and phone
userRouter.put(
  '/sendotp',

  asyncHandler(async (req, res) => {
    const { userId, smsSource } = req.body;

    const [SMSOTP, emailOTP, user] = await Promise.all([
      OTP(),
      OTP(),
      userServices.getUserById(userId),
    ]);
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      user.email,
      user.mobile,
      null
    );
    const updateOTP = await userServices.updateOTP(user, SMSOTP, emailOTP);
    if (otpExpiryValidation && false) {
      res.status(400).send({ msg: 'Retry after few minutes' });
    } else {
      if (updateOTP) {
        await Promise.all([
          mailServices.sentOTP(user.email, emailOTP),
          smsServices.sendSMS(user.mobile, new Date(), SMSOTP, smsSource),
        ]);
        res.status(200).send({ msg: 'OTP sent' });
      } else {
        res.status(400).send({ msg: 'OTP not updated' });
      }
    }
  })
);

//geting user registered vehicles list api
userRouter.post(
  '/getuservehiclelist',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const vehicleList = await userServices.userVehicles(userId);
    res.status(200).send({ data: vehicleList });
  })
);

userRouter.post(
  '/getuserschedules',
  asyncHandler(async (req, res) => {
    const { userId, isDriver } = req.body;
    if (isDriver) {
      const list = await driverRouteServices.driverRoutes(userId);
      res.status(200).send({ data: list });
    } else {
      const list = await scheduleRideServices.getuserSchedules(userId);
      res.status(200).send({ data: list });
    }
  })
);

//adding profile image api
userRouter.post(
  '/profileimage',

  asyncHandler(async (req, res) => {
    const { file, userId } = req.body;
    const profileImage = await uploadFile(file);
    if (profileImage) {
      const addProfileImage = await userServices.addProfileImage(
        userId,
        profileImage
      );
      if (addProfileImage) {
        res.status(200).send({ msg: 'Image uploaded', data: addProfileImage });
      } else {
        res.status(422).send({ msg: 'Image path not stored' });
      }
    } else {
      res.status(400).send({ msg: 'Image not uploaded' });
    }
  })
);

//update user info apis
userRouter.post(
  '/updateprofile',

  asyncHandler(async (req, res) => {
    const {
      userId,
      firstName,
      lastName,
      dob,
      gender,
      activeCorporateCode,
      corporateCode,
      smsSource,
    } = req.body;
    if (corporateCode) {
      const isValidCorporateCode = await corporateServices.findByCode(
        corporateCode
      );
      if (!isValidCorporateCode) {
        res.status(400).send({ msg: 'Invalid corporate code!' });
        return;
      }
    }
    const updatedProfile = await userServices.updateProfile(
      userId,
      firstName,
      lastName,
      dob,
      gender,
      activeCorporateCode,
      corporateCode,
      smsSource
    );
    if (updatedProfile) {
      res.status(200).send({ msg: 'Profile updated!', data: updatedProfile });
    } else {
      res.status(400).send({ msg: 'Failed to update profile!' });
    }
  })
);
//get profile
userRouter.post(
  '/getprofile',

  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    let userProfile = await userServices.getProfile(userId);
    if (userProfile) {
      // delete userProfile.password;
      res.status(200).send({ msg: 'User profile', data: userProfile });
    } else {
      res.status(400).send({ msg: 'user not found' });
    }
  })
);

//updated or change selected vehicle api
userRouter.post(
  '/updateselectedvehicle',

  asyncHandler(async (req, res) => {
    const { userId, vehicleId } = req.body;
    const result = await userServices.updateSelectedVehicle(userId, vehicleId);
    if (result) {
      res.status(200).send({ msg: 'Default vehicle selected successfully!' });
    } else {
      res.status(400).send({ msg: 'Oops vehicle not selected!' });
    }
  })
);

//adding rating to user
userRouter.post(
  'addrating',
  asyncHandler(async (req, res) => {
    const { userId, rating } = req.body;
    if (0 < rating <= 5) {
      const result = await userServices.addRating(userId, rating);
      if (result) {
        res.status(200).send({ msg: 'Thans for rating' });
      } else {
        res.status(400).send({ msg: 'Unable to proccess' });
      }
    }
    res.status(400).send({ msg: 'Rate between 1 to 5' });
  })
);

//refresh fcmToken api
userRouter.put(
  '/refreshfcm',
  asyncHandler(async (req, res) => {
    const { userId, fcmToken } = req.body;
    const result = await userServices.updateFcm(userId, fcmToken);
    if (result) {
      res.status(200).send({ msg: 'FCM updated!', data: result });
    } else {
      res.status(400).send({ msg: 'Token not updated' });
    }
  })
);

//lougout api
userRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    // console.log(userId);
    const result = await userServices.logout(userId);
    if (result) {
      res.status(200).send({ msg: 'You are logged out!' });
    } else {
      res.status(400).send({ msg: 'Logging out failed' });
    }
  })
);

//delete a registered vehicle
userRouter.put(
  '/deletevehicle',
  asyncHandler(async (req, res) => {
    const { userId, vehicleId } = req.body;
    const anyActiveRide = await driverRouteServices.vehicleDeleteValidation(
      vehicleId
    );
    if (anyActiveRide) {
      res.status(400).send({ msg: 'Finish or cancel ride first' });
      return;
    }
    const result = await userServices.deleteVehicle(userId, vehicleId);
    if (result) {
      res.status(200).send({ data: result });
    } else {
      res.status(400).send({ msg: 'Oops vehicle not deleted!' });
    }
  })
);

//Api for user to create invite code
userRouter.post(
  '/invitecode',
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const code = referralCode();
    const addInviteCode = await userServices.addInviteCode(userId, code);
    if (addInviteCode) {
      res.status(200).send({ msg: 'Invitation sent!', data: addInviteCode });
    } else {
      res.status(400).send({ msg: 'Failed to send invite!' });
    }
  })
);

userRouter.post(
  '/sendinvite',
  asyncHandler(async (req, res) => {
    const { userId, mobile } = req.body;
    var user = await userServices.getUserById(userId);
    if (user.inviteCode) {
      const result = await smsServices.sendInvite(
        mobile,
        'E',
        user.firstName + ' ' + user.lastName,
        user.inviteCode
      );
      res.status(200).send({ data: result });
    } else {
      const code = referralCode();
      user = await userServices.addInviteCode(userId, code);
      const result = await smsServices.sendInvite(
        mobile,
        'R',
        user.firstName + ' ' + user.lastName,
        user.inviteCode
      );
      res.status(200).send({ data: result });
    }
  })
);

userRouter.get(
  '/schedules?',
  asyncHandler(async (req, res) => {
    const { userId, isDriver, check, page } = req.query;

    const skip = (page || 0) * 5;
    var result = [];
    if (isDriver == 'true') {
      if (check === 'total') {
        result = await driverRouteServices.totalRides(userId, skip);
      } else if (check === 'completed') {
        result = await driverRouteServices.completedRides(userId, skip);
      } else if (check === 'cancelled') {
        result = await driverRouteServices.cancelledRides(userId, skip);
      } else if (check === 'upcoming') {
        result = await driverRouteServices.upcomingSchedules(userId, skip);
      }
    } else {
      if (check === 'total') {
        result = await scheduleRideServices.totalRides(userId, skip);
      } else if (check === 'completed') {
        result = await scheduleRideServices.completedRides(userId, skip);
      } else if (check === 'cancelled') {
        result = await scheduleRideServices.cancelledRides(userId, skip);
      } else if (check === 'upcoming') {
        result = await scheduleRideServices.upcomingSchedules(userId, skip);
      }
    }
    res.send({ msg: 'rides list', data: result });
  })
);

userRouter.post(
  '/uploadDocument',

  asyncHandler(async (req, res) => {
    const { userId, documents } = req.body;
    documents.frontImage = await uploadFile(documents.frontImage);
    documents.backImage = await uploadFile(documents.backImage);
    const result = await userServices.document(userId, documents);
    if (result) {
      delete result.password;
      delete result.SMSOTP;
      delete result.emailOTP;
      delete result.referBy;
      delete result.OTPExpiry;
      res.status(200).send({ msg: 'Documents uploaded!', data: result });
    } else {
      res.status(400).send({ msg: 'Documents failed to upload!' });
    }
  })
);

userRouter.post(
  '/updateDocument',
  asyncHandler(async (req, res) => {
    let {
      userId,
      type,
      frontImage,
      backImage,
      updatedFrontImage,
      updatedBackImage,
    } = req.body;
    if (updatedFrontImage) {
      frontImage = await uploadFile(updatedFrontImage);
    }
    if (updatedBackImage) {
      backImage = await uploadFile(updatedBackImage);
    }
    console.log('frontImage', frontImage);
    const result = await userServices.updateDocument(
      userId,
      type,
      frontImage,
      backImage
    );
    if (result) {
      delete result.password;
      delete result.SMPOTP;
      delete result.emailOTP;
      delete result.referBy;
      delete result.OTPExpiry;
      res.status(200).send({
        msg: `Document for ${type} are submitted`,
        data: result,
      });
    } else {
      res.status(400).send({ msg: `Failed to update documents` });
    }
  })
);

userRouter.get(
  '/userDocuments',
  asyncHandler(async (req, res) => {
    let { userId } = req.query;
    const result = await userServices.userDocuments(userId);
    if (result) {
      res.status(200).send({
        msg: `Documents`,
        data: result,
      });
      return;
    } else {
      res.status(404).send({ msg: `Not Found` });
      return;
    }
  })
);
userRouter.post(
  '/updateDocumentStatus',
  asyncHandler(async (req, res) => {
    let { userId, type, status, comment } = req.body;
    const result = await userServices.updateDocument(
      userId,
      type,
      status,
      comment
    );
    if (result) {
      res.status(200).send({ msg: `Document status is updated to ${status}` });
      const io = req.app.get('socket');
      const userSocket = getUserSockets(userId);
      console.log('userSocket', userSocket);
      if (userSocket[0]?.socketId) {
        io.to(userSocket[0].socketId).emit(
          'documentsStatus',
          JSON.stringify(encryptData({ flag: type }))
        );
      }
      try {
        notificationServices.newNotification(
          `Your documents status changed to ${status}`,
          'Document status change',
          result.fcmToken,
          {},
          null
        );
      } catch (error) {
        console.log(error.message);
      }
    } else {
      res.status(400).send({ msg: `Failed to update document status` });
    }
  })
);

//soft delete end point to delete user will accept userId

userRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { userId, password } = req.query;
    const duePayment = await userWalletServices.getWallet(userId);
    if (duePayment && duePayment.wallet < 0) {
      return res.status(400).send({
        msg: 'Please pay you due amount to delete account!',
      });
    }
    //for driver routes
    const isActiveRoute = await driverRouteServices.anyActiveRide(userId);

    if (isActiveRoute) {
      return res.status(400).send({
        msg: 'Please complete your active ride first to delete your account!',
      });
    } else {
      //checking for passenger side
      const isActiveOrAcceptedSchedule =
        await scheduleRideServices.isActiveOrAccepted(userId);
      if (isActiveOrAcceptedSchedule) {
        return res.status(400).send({
          msg: 'Please cancel or complete your ride first to delete your account!',
        });
      }
    }

    const anyActiveRouteByDriver = await driverRouteServices.anyActiveRoute(
      userId
    );
    if (anyActiveRouteByDriver) {
      return res.status(400).send({
        msg: 'Please cancel your schedule as owner first to delete your account!',
      });
    }

    const anyPendingSchedule = await scheduleRideServices.anyPendingSchedule(
      userId
    );
    if (anyPendingSchedule) {
      return res.status(400).send({
        msg: 'Please delete your schedule as passenger first to delete your account!',
      });
    }
    const isActiveRide = await driverRouteServices.anyActiveRide(userId);
    if (isActiveRide) {
      res.status(400).send({ msg: 'Please finish your ride first!' });
      return;
    }
    const user = await userServices.getUser(userId);
    if (user) {
      const comparePassword = await userServices.validatePassword(
        password,
        user.password
      );
      if (comparePassword) {
        const result = await userServices.deleteUser(userId);
        if (result) {
          res.status(200).send({ msg: 'Account deleted!' });
        } else {
          res.status(400).send({ msg: 'Oops, try again!' });
        }
      } else {
        res.status(400).send({ msg: 'Invalid password!' });
      }
    } else {
      res.status(400).send({ msg: 'Account not found!' });
    }
  })
);

//end point to find user against mobile number to change mobile number
userRouter.post(
  '/lookup',
  asyncHandler(async (req, res) => {
    const { userId, mobile, smsSource } = req.body; //getting mobile number from request
    if (!userId && !mobile) {
      res.status(400).send({ msg: 'Some details are missing!' });
    } else {
      //own for user and registred for other user mobile registred
      const [own, registered] = await Promise.all([
        //find either mobile number is already with user requested or not
        userServices.findMobileAgainstUserId(userId, mobile),
        //pass mobile and (email,cnic) as null
        userServices.isValid(mobile, null, null),
      ]);

      if (own) {
        //if mobile number is associated with user
        res.status(400).send({ msg: 'Please provide a new number!' });
      } else {
        //if mobile number is not associated with user
        if (registered) {
          //if mobile number is registred with an other user
          res
            .status(400)
            .send({ msg: 'This number is already registered with Rahper!' });
        } else {
          //if mobile no is not registred then send otp
          const otp = OTP();
          smsServices.sendSMS(mobile, new Date(), otp, smsSource),
            console.log({ userId, otp });

          const updateOTP = await userServices.updateOTPWithId(userId, otp);
          if (updateOTP) {
            res.status(200).send({ msg: 'OTP sent on number!' });
          } else {
            res.status(400).send({ msg: 'Some issue in sending OTP!' });
          }
        }
      }
    }
  })
);

//end point to change mobile number parm required are user id mobile(to change) and OTP(SMSOTP)

userRouter.put(
  '/updateMoible',
  asyncHandler(async (req, res) => {
    const { userId, mobile, OTP } = req.body;
    if (!userId || !mobile || !OTP) {
      //if userId, mobile or otp is missing in body
      res.status(400).send({ msg: 'Some details are missing!' });
    } else {
      //validating otp expiry time
      const otpExpiryValidation = await userServices.otpExpiryValidation(
        null,
        null,
        userId
      );
      if (otpExpiryValidation) {
        //validating OTP with user id
        const validateSMSOTPBYId = await userServices.validateSMSOTPBYId(
          userId,
          OTP
        );
        if (validateSMSOTPBYId) {
          //if OTP is valid then update mobile number
          const result = await userServices.updateMobile(userId, mobile);
          if (result) {
            //if moible number updated then send respose with 200
            res
              .status(200)
              .send({ msg: 'Mobile number updated!', data: result });
          } else {
            res.status(400).send({ msg: 'Mobile number not updated!' });
          }
        } else {
          res.status(400).send({ msg: 'Invalid OTP!' });
        }
      } else {
        res.status(400).send({ msg: 'OTP expire!' });
      }
    }
  })
);

userRouter.patch(
  '/acitveCorporateCode',
  expressAsyncHandler(async (req, res) => {
    const { userId, flag } = req.body;
    if (!userId) {
      res.status(400).send({ msg: 'User Id is invalid' });
    }
    const result = await userServices.activeCorporateCode(userId, flag);
    if (result) {
      res.status(200).send({
        msg: 'Corporate Code is ' + (flag ? 'active' : 'inactive'),
      });
    } else {
      res.status(400).send({ msg: 'Failed to complete action!' });
    }
  })
);

userRouter.post(
  '/verifyZindigiAccount',

  expressAsyncHandler(async (req, res) => {
    const { userId, zindigiAccountNumber } = req.body;
    const validateZindigiAccount =
      await zindigiWalletServerices.verifyAccountToLink(zindigiAccountNumber);
    if (validateZindigiAccount) {
      const otp = OTP();
      // console.log({ userId, otp });
      const updateOTP = await userServices.updateOTPWithId(userId, otp);
      if (updateOTP) {
        res.status(200).send({ msg: 'OTP sent on number!' });
      } else {
        res.status(400).send({ msg: 'Some issue in sending OTP!' });
      }
    } else {
      res
        .status(400)
        .send({ msg: 'This number is not registred with Zindigi!' });
    }
  })
);

userRouter.post(
  '/linkZindigiAccount',

  expressAsyncHandler(async (req, res) => {
    const { userId, zindigiAccountNumber, OTP } = req.body;
    //validating otp expiry time
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      null,
      null,
      userId
    );
    if (otpExpiryValidation) {
      //validating OTP with user id
      const validateSMSOTPBYId = await userServices.validateSMSOTPBYId(
        userId,
        OTP
      );
      if (validateSMSOTPBYId) {
        const linkZindigiAccount = await userServices.addZindigiAccount(
          userId,
          zindigiAccountNumber
        );
        if (linkZindigiAccount) {
          res.status(200).send({
            msg: 'Your zindigi account is linked with Rahper!',
          });
        } else {
          res.status(400).send({ msg: 'Failed to link zindigi account!' });
        }
      } else {
        res.status(400).send({ msg: 'Invalid OTP!' });
      }
    } else {
      res.status(400).send({ msg: 'OTP expire!' });
    }
  })
);

userRouter.post(
  '/zindigiwalletOTP',

  expressAsyncHandler(async (req, res) => {
    const { userId, smsSource } = req.body;
    const otp = OTP();
    const updateOTP = await userServices.updateOTPWithId(userId, otp);
    await smsServices.sendSMS(updateOTP.mobile, new Date(), otp, smsSource);
    if (updateOTP) {
      res.status(200).send({ msg: 'OTP sent on number!' });
    } else {
      res.status(400).send({ msg: 'Some issue in sending OTP!' });
    }
  })
);

userRouter.post(
  '/unlinkZindigiAccount',

  expressAsyncHandler(async (req, res) => {
    const { userId, OTP } = req.body;
    //validating otp expiry time
    const otpExpiryValidation = await userServices.otpExpiryValidation(
      null,
      null,
      userId
    );
    if (otpExpiryValidation) {
      //validating OTP with user id
      const validateSMSOTPBYId = await userServices.validateSMSOTPBYId(
        userId,
        OTP
      );
      if (validateSMSOTPBYId) {
        const unlinkZindigiAccount = await userServices.removeZindigiAccount(
          userId
        );
        if (unlinkZindigiAccount) {
          res.status(200).send({
            msg: 'Your Zindigi wallet account has been de-linked!',
          });
        } else {
          res.status(400).send({ msg: 'Failed to de-link zindigi account!' });
        }
      } else {
        res.status(400).send({ msg: 'Invalid OTP!' });
      }
    } else {
      res.status(400).send({ msg: 'OTP expire!' });
    }
  })
);

userRouter.post(
  '/getWalletInfo',

  expressAsyncHandler(async (req, res) => {
    const { userId } = req.body;
    const walletInfo = await userServices.getWallet(userId);
    const wallet = await userWalletServices.getWallet(userId);
    if (walletInfo) {
      walletInfo.wallet.balance = wallet.wallet;
      if (walletInfo.zindigiWallet.linked) {
        const zindigiWallet = await zindigiWalletServerices.getWalletInfo(
          walletInfo.zindigiWallet.zindigiWalletNumber
        );
        if (zindigiWallet) {
          res.status(200).send({
            msg: 'Wallet info!',
            data: { walletInfo, zindigiWalletInfo: zindigiWallet },
          });
        } else {
          res.status(200).send({
            msg: 'Wallet info!',
            data: { walletInfo, zindigiWalletInfo: null },
          });
        }
      } else {
        res.status(200).send({
          msg: 'Wallet info!',
          data: { walletInfo, zindigiWalletInfo: null },
        });
      }
    } else {
      res.status(400).send({ msg: 'Failed to get wallet!' });
    }
  })
);

module.exports = userRouter;
