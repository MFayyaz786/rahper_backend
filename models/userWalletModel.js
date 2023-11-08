const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    wallet: { type: Number, default: 0 },
    history: [
      new Schema({ amount: Number, source: String }, { timestamps: true }),
    ],
  },
  { timestamps: true }
);

const userWalletModel = new mongoose.model("UserWallet", schema);

module.exports = userWalletModel;
