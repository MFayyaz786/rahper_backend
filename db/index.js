const mongoose = require("mongoose");

mongoose
  .connect(process.env.REMOTEDATABASE)
  .then(() => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log(err);
  });
