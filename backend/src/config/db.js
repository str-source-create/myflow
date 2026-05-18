/**
 * db.js
 * Source file for the cleanflow application.
 */

const mongoose = require('mongoose')

const connectDB = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'PASTE_YOUR_MONGODB_URI_HERE') {
    console.error('ERROR: MONGODB_URI is not set in your .env file')
    console.log('Steps to fix:')
    console.log('1. Go to https://cloud.mongodb.com')
    console.log('2. Create a free account and cluster')
    console.log('3. Click Connect > Drivers > copy the connection string')
    console.log('4. Paste it as MONGODB_URI in your backend/.env file')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    console.log('')
    console.log('Common causes:')
    console.log('- Wrong username or password in connection string')
    console.log('- Your IP address is not whitelisted in MongoDB Atlas')
    console.log('  Fix: Atlas dashboard > Network Access > Add IP > Allow from anywhere (0.0.0.0/0)')
    process.exit(1)
  }
}

module.exports = connectDB
