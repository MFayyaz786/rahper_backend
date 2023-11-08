const nodemailer = require('nodemailer');
const newPasswordTemplate = require('../emailTemplates/newPasswordTemplate');
const vehicleVerificationTemplate = require('../emailTemplates/vehicleVerificationTemplate');
const  receiptTemplate = require('../emailTemplates/receiptTemplate');
const addVehicleTemplate = require('../emailTemplates/addVehicleTemplate');
require('dotenv').config();
var transporter = nodemailer.createTransport({
  host: process.env.MAILHOST,
  port: process.env.MAILPORT,
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAILPASS,
  },
});
const mailServices = {
  sentOTP: async (to, OTP) => {
    let info = await transporter.sendMail({
      from: `"Rahper" <${process.env.MAIL}>`, // sender address
      to: to.toString(), // list of receivers
      subject: 'OTP', // Subject line
      text: ` Your OTP is ${OTP}`, // plain text body
      html: `Your OTP is <b>${OTP}</b>`, // html body
    });

    // console.log("Message sent: %s", info.messageId);

    return info;
  },

  sentMail: async (to, message, flag, data) => {
    let subject = '',
      text = '',
      html = '';
    if (flag == 'newPassword') {
      subject = 'New Password';
      text = 'Your new password is ' + message;
      html = newPasswordTemplate(message);
    } else if (flag == 'vehicleVerification') {
      subject = 'New vehicle';
      text =
        'A new vehicle is awaiting verification. Please review the details and approve it if appropriate. Click here ' +
        message;
      html = vehicleVerificationTemplate(message);
    } else if (flag == 'receipt') {
      subject = 'New vehicle';
      text = `Hi ${data.name},

Thanks for using Rahper. This email is to confirm the payment for your recent ride.

Receipt ID: ${data.receiptId}
Date: ${data.date}
Time: ${data.time}
Payment Method: ${data.method}
Pickup Location: ${data.pickupLocation}
Drop-off Location: ${data.dropOffLocation}
Payment ID: ${data.receiptId}
Total Fare: ${data.fare}

If you have any questions about this receipt, simply reply to this email or reach out to our support team at support@rahper.com for help.

Cheers,
The Rahper team

Rahper PVT. LTD.
`;
      html = receiptTemplate(
        data.receiptId,
        data.date,
        data.time,
        data.method,
        data.name,
        data.pickupLocation,
        data.dropOffLocation,
        data.fare
      );
    } else if (flag == 'addVehicle') {
      subject =
        'Rahper | Vehicle registration flow for users who have registered but not added a vehicle';
      text =
        'Vehicle registration flow for users who have registered but not added a vehicle';
      html = addVehicleTemplate();
    } else if (flag == 'receipt') {
    } else {
      return null;
    }
    if (process.env.NODE_ENV == 'production') {
      let info = await transporter.sendMail({
        from: `"Rahper" <${process.env.MAIL}>`, // sender address
        to: to.toString(), // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body
      });
      // console.log("Message sent: %s", info.messageId);
      return info;
    } else {
      return {};
    }
  },
};
module.exports = mailServices;
