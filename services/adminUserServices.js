const adminUserModel = require('../models/adminUserModel');
const bcryptjs = require('bcryptjs');
const generateToken = require('../utils/token');
const OTP = require('../utils/OTP');
const userTypes = require('../utils/userTypes');
const mailServices = require('./mailServices');
const adminUserServices = {
  all: async (pageNumber, text) => {
    pageNumber = parseInt(pageNumber) + 1; // Specify the page number you want to retrieve
    const pageSize = 50; // Specify the number of documents per page
    console.log(pageNumber);
    const skip = (pageNumber - 1) * pageSize;
    if (!text) {
      const result = await adminUserModel
        .find({ role: { $ne: '6374d6149e13da1d01f97b06' } })
        .populate({
          path: 'role',
          select: { _id: 1, role: 1 },
        })
        .skip(skip)
        .limit(pageSize);
      return result;
    } else {
      const result = await adminUserModel
        .find({
          role: { $ne: '6374d6149e13da1d01f97b06' },
          $text: { $search: text },
        })
        .populate({
          path: 'role',
          select: { _id: 1, role: 1 },
        })
        .skip(skip)
        .limit(pageSize);
      return result;
    }
  },
  totalCount: async (text) => {
    if (text) {
      const count = await adminUserModel.count({ $search: { $text: text } });
      return count;
    }
    const count = await adminUserModel.count();
    return count;
  },
  //register admin user servece will accept userName, password, role, mobile, email and return adminuser object if success and else null
  validateUserName: async (userName) => {
    const result = await adminUserModel.findOne({
      $or: [{ userName: userName }],
    });
    return result;
  },
  validateEmail: async (email) => {
    const result = await adminUserModel.findOne({
      $or: [{ email: email }],
    });
    return result;
  },

  validateUserNameAndEmail: async (email, userName) => {
    const result = await adminUserModel.findOne({
      $or: [{ email }, { userName }],
    });
    return result;
  },
  register: async (userName, password, role, mobile, email) => {
    console.log(userName, password, role, mobile, email);

    password = await bcryptjs.hash(password, 12);
    const newAdminUser = new adminUserModel({
      userName,
      password,
      role,
      mobile,
      email,
    });
    newAdminUser.token = await generateToken(
      newAdminUser._id.toString(),
      userTypes.WEBUSER
    );
    const result = await newAdminUser.save();
    return result;
  },

  //update
  update: async (userId, userName, password, role, mobile, email, status) => {
    try {
      const data = { userId, userName, password, role, mobile, email, status };
      if (password) {
        data.password = await bcryptjs.hash(password, 12);
      } else {
        delete data.password;
      }
      token = await generateToken(userId.toString(), userTypes.WEBUSER);
      const updateUser = await adminUserModel.findOneAndUpdate(
        { _id: userId },
        data //to update
      );
      return updateUser;
    } catch (e) {
      throw new Error('User already exists');
    }
  },
  //update token will accept _id of the admin user , update token and return updated result
  updateToken: async (_id, token) => {
    const result = await adminUserModel.findOneAndUpdate(
      { _id },
      { token },
      { new: true }
    );
    return result;
  },

  //this will accept id and return user if found otherwise null
  getUserById: async (_id) => {
    const result = await adminUserModel.findOne({ _id });
    return result;
  },

  //this will compare password with hash password and retrun boolean
  validatePassword: async (password, hash) => {
    const validate = await bcryptjs.compare(password, hash);
    return validate;
  },

  //this will accept userName and return user if found otherwise null
  getUserByUserName: async (userName) => {
    const result = await adminUserModel.findOne({ userName });
    return result;
  },

  login: async (email, userName) => {
    const result = await adminUserModel.aggregate([
      {
        $match: {
          $or: [{ email }, { userName }],
        },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $unwind: {
          path: '$role',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'submodules',
          localField: 'role.permissions',
          foreignField: '_id',
          as: 'permissions',
        },
      },
      {
        $unwind: {
          path: '$permissions',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$permissions.module',
          permissions: {
            $push: '$permissions',
          },
          user: {
            $first: '$$ROOT',
          },
        },
      },
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: '_id',
          as: '_id',
        },
      },
      {
        $unwind: {
          path: '$_id',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          user: {
            $first: '$user',
          },
          permissions: {
            $push: {
              module: '$_id',
              subModule: '$permissions',
            },
          },
        },
      },
      {
        $project: {
          _id: '$user._id',
          userName: '$user.userName',
          password: '$user.password',
          role: {
            _id: '$user.role._id',
            role: '$user.role.role',
            description: '$user.role.description',
          },
          mobile: '$user.mobile',
          email: '$user.email',
          status: '$user.status',
          permissions: {
            $map: {
              input: '$permissions',
              as: 'permission',
              in: {
                module: '$$permission.module.name',
                route: '$$permission.module.route',
                orderPosition: '$$permission.module.orderPosition',
                icon: '$$permission.module.icon',

                subModule: {
                  $map: {
                    input: '$$permission.subModule',
                    as: 'sub',
                    in: {
                      name: '$$sub.name',
                      route: '$$sub.route',
                      orderPosition: '$$sub.orderPosition',
                      icon: '$$sub.icon',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);
    if (result.length > 0) {
      result[0].permissions.sort((a, b) => a.orderPosition - b.orderPosition);
      result[0].permissions.forEach((element) => {
        element.subModule.sort((a, b) => a.orderPosition - b.orderPosition);
      });
    }
    return result[0];
  },
  //this will accept email and return user if found otherwise null
  getUserByEmail: async (email) => {
    const result = await adminUserModel.findOne({ email });
    return result;
  },

  //this will accept user id and set token and fcmToken to null
  signout: async (_id) => {
    const result = await adminUserModel.findOneAndUpdate(
      { _id },
      { token: null, fcmToken: null }
    );
    return result;
  },

  //this will update otp and send by mail to user based on email and return boolean
  updateOTP: async (email) => {
    const otp = OTP();
    const result = await adminUserModel.findOneAndUpdate(
      { email },
      { otp: 1122 },
      { new: true }
    );
    if (result) {
      // await mailServices.sentOTP(email, otp);
      return true;
    } else {
      return false;
    }
  },

  //validate otp will accept email and otp and return boolean
  validateOTP: async (email, otp) => {
    const result = await adminUserModel.findOne({ email, otp });
    return result != null;
  },

  //this will accept email and password, update password and return boolean
  updatePassword: async (email, password) => {
    password = await bcryptjs.hash(password, 12);
    const result = await adminUserModel.findOneAndUpdate(
      { email },
      { password, otp: null },
      { new: true }
    );
    return result != null;
  },
};

module.exports = adminUserServices;
