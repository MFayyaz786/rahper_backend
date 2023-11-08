const express = require('express');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const adminUserServices = require('../../services/adminUserServices');
const authIdServices = require('../../services/authIdServices');
const jwtServices = require('../../utils/jwtServices');
const moduleServices = require('../../services/moduleServices');
const mailServices = require('../../services/mailServices');
const randomPassword = require('../../utils/randomPassword');
const roleServices = require('../../services/roleServices');
const permissionServices = require('../../services/permissionServices');

const webRouter = express.Router();

webRouter.get(
  '/all?',
  asyncHandler(async (req, res) => {
    const { pageNumber, text } = req.query;
    const [user, count] = await Promise.all([
      adminUserServices.all(pageNumber, text),
      adminUserServices.totalCount(text),
    ]);
    if (user.length != 0) {
      res.status(200).send({ msg: 'Admin user ', users: user, count });
    } else {
      res.status(200).send({ msg: 'Admin user ', users: user, count });
    }
  })
);

webRouter.post(
  '/adminUser',
  asyncHandler(async (req, res) => {
    let { userName, password, role, mobile, email } = req.body;
    if (!userName || !password || !role || !mobile || !email) {
      res.status(400).send({ msg: 'Provide all details!' });
      return;
    }
    // email = email.split("@")[1];
    //console.log("email", email);
    if (!email.endsWith('@rahper.com')) {
      res.status(400).send({
        msg: `${email} is not a valid email address for the domain!`,
      });
      return;
    }
    const mobileRegex = /^03[0-9]{9}$/;
    if(!mobileRegex.test(mobile)){
      return res.status(400).send({ msg: "Invalid mobile number enter 03xxxxxxxxx" });
    }
    const validateUserNameAndEmail =
      await adminUserServices.validateUserNameAndEmail(email, userName);
    if (validateUserNameAndEmail) {
      res.status(400).send({ msg: 'Email or username already exist!' });
      return;
    }

    try {
      const result = await adminUserServices.register(
        userName,
        password,
        role,
        mobile,
        email
      );
      if (result) {
        const uuid = uuidv4();
        const refreshToken = jwtServices.create({ uuid, type: 'admin' });
        const token = jwtServices.create(
          { userId: result._id, type: 'admin' },
          '5m'
        );
        authIdServices.add(result._id, uuid);
        res.status(200).send({
          msg: 'Admin user registered!',
          data: result,
          token,
          refreshToken,
        });
      } else {
        res.status(400).send({ msg: 'Admin user registration failed!' });
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ msg: e.message });
    }
  })
);

webRouter.post(
  '/resetPassword',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).send({ msg: 'Please send admin email!' });
      return;
    }
    try {
      const password = randomPassword(8);
      console.log({ password });
      const updatePassword = await adminUserServices.updatePassword(
        email,
        password
      );
      if (updatePassword) {
        const message = password;
        await mailServices.sentMail(email, message, 'newPassword');
        res.status(200).send({ msg: 'Password updated!' });
      } else {
        res.status(400).send({ msg: 'User not found with this email!' });
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ msg: e.message });
    }
  })
);

webRouter.post(
  '/refreshToken',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const verifyToken = jwtServices.authenticate(refreshToken);
    if (verifyToken) {
      const { uuid, type } = verifyToken;
      const AuthId = await authIdServices.findByUUID(uuid);
      if (AuthId) {
        const { userId } = AuthId;
        if (userId) {
          const token = jwtServices.create({ userId, type }, '5m');
          res.status(200).send({ msg: '', data: { token } });
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

//update data
webRouter.patch(
  '/adminUser',
  asyncHandler(async (req, res) => {
    const { userId, userName, password, role, mobile, email, status } =
      req.body;
    if (!userId || !userName || !role || !mobile || !email) {
      res.status(400).send({ msg: 'Provide all details!' });
      return;
    }
    const emailExist = await adminUserServices.validateEmail(email);
    if (emailExist && emailExist?._id.toString() != userId) {
      res.status(400).send({ msg: 'Email already exist!' });
      return;
    }
    // if (emailExist && emailExist.status === status) {
    //   let userStatus;
    //   if (status === true) {
    //     userStatus = "Active";
    //   } else {
    //     userStatus = "InActive";
    //   }
    //   res.status(400).send({
    //     msg: `Already status ${userStatus}`,
    //   });
    //   return;
    // }
    const userNameExist = await adminUserServices.validateUserName(userName);
    if (userNameExist && userNameExist?._id.toString() != userId) {
      res.status(400).send({ msg: 'UserName already exist!' });
      return;
    }

    const result = await adminUserServices.update(
      userId,
      userName,
      password,
      role,
      mobile,
      email,
      status
    );

    if (result) {
      res.status(200).send({ msg: 'Admin user updated!', data: result });
    } else {
      res.status(400).send({ msg: 'Failed to update!' });
    }
  })
);

//admin panel login in endpoint
webRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;
    // if (email) {
    const user = await adminUserServices.login(email, userName);
    console.log(user);
    if (user) {
      const validatePassword = await adminUserServices.validatePassword(
        password,
        user.password
      );
      if (!user?.status) {
        res.status(400).send({ msg: 'This user is inactive!' });
        return;
      }
      if (validatePassword) {
        const uuid = uuidv4();
        const refreshToken = jwtServices.create({ uuid, type: 'admin' });
        const token = jwtServices.create(
          { userId: user._id, type: 'admin' },
          '5m'
        );
        authIdServices.add(user._id, uuid);
        await adminUserServices.updateToken(user._id, token);
        const menu = await roleServices.menu(user?.role?._id?.toString());
        const permissions = await permissionServices.getByRole(
          user?.role?._id?.toString()
        );
        user.menu = menu;
        user.permissions = permissions;
        res.status(200).send({
          msg: 'User logged in!',
          data: user,
          token,
          refreshToken,
        });
      } else {
        res.status(400).send({ msg: 'Invalid credentials!' });
      }
    } else {
      res.status(400).send({ msg: 'Invalid credentials!' });
    }
    // } else if (userName) {
    //   const user = await adminUserServices.getUserByUserName(userName);
    //   if (user) {
    //     const validatePassword = await adminUserServices.validatePassword(
    //       password,
    //       user.password
    //     );
    //     if (validatePassword) {
    //       const uuid = uuidv4();
    //       const refreshToken = jwtServices.create({ uuid, type: "admin" });
    //       const token = jwtServices.create(
    //         { userId: user._id, type: "admin" },
    //         "5m"
    //       );
    //       authIdServices.add(user._id, uuid);
    //       const updatedUser = await adminUserServices.updateToken(
    //         user._id,
    //         token
    //       );
    //       res.status(200).send({
    //         msg: "User logged in!",
    //         data: updatedUser,
    //         token,
    //         refreshToken,
    //       });
    //     } else {
    //       res.status(400).send({ msg: "Invalid credentials!" });
    //     }
    //   } else {
    //     res.status(400).send({ msg: "Invalid credentials!" });
    //   }
    // } else {
    //   res.status(400).send({ msg: "Please Provide Email or userName!" });
    // }
  })
);

webRouter.post(
  '/otpRequest',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await adminUserServices.updateOTP(email);
    if (result) {
      res.status(200).send({ msg: "OTP sent to you're email!" });
    } else {
      res.status(400).send({ msg: 'There is some problem sending OTP!' });
    }
  })
);

webRouter.put(
  '/updatePassword',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // const result = await adminUserServices.validateOTP(email, otp);
    // if (result) {
    const updatePassword = await adminUserServices.updatePassword(
      email,
      password
    );
    if (updatePassword) {
      res.status(200).send({ msg: 'Password updated!' });
    } else {
      res.status(400).send({ msg: 'Password not updated!' });
    }
    // } else {
    //   res.status(400).send({ msg: "Invalid OTP!" });
    // }
  })
);

module.exports = webRouter;
