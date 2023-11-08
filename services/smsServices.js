const dotenv = require('dotenv');
const axios = require('axios');
const exceptionErrorsModel = require('../models/exceptionErrorsModel');
const whatsAppMessage = require('../utils/whatsAppMessage');
const smsLogServices = require('./smsLogServices');
dotenv.config();
const smsServices = {
  sendSMS: async (
    PhoneNumber,
    RequestedDateTime = new Date(),
    Message,
    source = 'sms'
  ) => {
    console.log({ PhoneNumber, RequestedDateTime, Message });
    if (typeof Message == 'number') {
      Message = `Your Rahper OTP is ${Message}`;
      Message = `Your Rahper One-Time Password (OTP) is: ${Message}. This OTP is valid for 2 minutes. Please do not share it with anyone. Thank you.`;
    }
    if (source == 'whatsApp') {
      await whatsAppMessage(PhoneNumber, Message);
      return;
    }

    try {
      const axios = require('axios');

      const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:SendSMS>
         <!--Optional:-->
         <tem:UserId>${process.env.SMSUserName}</tem:UserId>
         <!--Optional:-->
         <tem:Password>${process.env.SMSPassword}</tem:Password>
         <!--Optional:-->
         <tem:MobileNo>${PhoneNumber}</tem:MobileNo>
         <!--Optional:-->
         <tem:MsgId>${Date.now()}</tem:MsgId>
         <!--Optional:-->
         <tem:SMS>${Message}</tem:SMS>
         <!--Optional:-->
         <tem:MsgHeader>${process.env.SMSHEADER}</tem:MsgHeader>
         <!--Optional:-->
         <tem:HandsetPort></tem:HandsetPort>
         <!--Optional:-->
         <tem:SMSChannel></tem:SMSChannel>
         <!--Optional:-->
         <tem:Telco></tem:Telco>
      </tem:SendSMS>
   </soapenv:Body>
</soapenv:Envelope>
`;

      const headers = {
        'Content-Type': 'text/xml',
      };

      const url = process.env.SMSURL;

      const res = await axios.post(url, xml, { headers });
      if (res.status >= 200 && res.status < 400) {
        await smsLogServices.addLog(PhoneNumber, RequestedDateTime, Message);
      }
      return res;
    } catch (error) {
      console.log(error);
      return { msg: error.message };
    }
  },

  sendInvite: async (Mobile, Type, name, code) => {
    data = {
      Message:
        name + ' invited you to join Rahper. Use invitation code: ' + code,
      Mobile,
      Type,
    };
    const result = await axios.post(process.env.SMSPOSTURL, data);
    console.log({ status: result.status });
    return { status: result.status };
  },
};

module.exports = smsServices;
