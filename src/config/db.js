const mongoose = require("mongoose");
//intialize and connect to server databse 
async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  //uri is setup in a env with a link 
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };
