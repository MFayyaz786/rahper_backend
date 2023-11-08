const dotenv = require("dotenv");
dotenv.config();

module.exports =
  process.env.NODE_ENV == "production"
    ? {
        VerifyAccount: "Bg1$fch&%123",
        BalanceInquiry: "$67gHS#$123",
        WalletToWalletPayment: "$67gHS#$123",
        AccountOpening: "HH$fch&%123",
        LinkAccount: "kl#$fch&%23",
        DebitInquiry: "$67gHS#$123",
        DebitPayment: "$67gHS#$123",
      }
    : {
        VerifyAccount: "verifyAcc!@#",
        BalanceInquiry: "balanceinquiry!@#",
        WalletToWalletPayment: "walletPayment!@#",
        AccountOpening: "createAccount!@#",
        LinkAccount: "linkAcc!@#",
        DebitInquiry: "#123456",
        DebitPayment: "#123456",
      };
