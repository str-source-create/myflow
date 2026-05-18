/**
 * server.js
 * Source file for the cleanflow application.
 */

require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 3000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('==================================')
    console.log(`CleanFlow API running on http://localhost:${PORT}`)
    console.log('==================================')
  })
}).catch((err) => {
  console.error('Failed to connect to database:', err.message)
  console.log('')
  console.log('HINT: Make sure your MONGODB_URI is set correctly in the .env file')
  process.exit(1)
})

