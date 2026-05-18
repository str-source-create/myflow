require("dotenv").config();
const mongoose = require("mongoose");

async function testMongo() {
  try {
    console.log("Current folder:", process.cwd());
    console.log("MONGODB_URI exists:", Boolean(process.env.MONGODB_URI));

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected from Node successfully");

    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("MongoDB ping successful");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Node MongoDB connection failed:");
    console.error(error.message);
  }
}

testMongo();
