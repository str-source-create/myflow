/**
 * app.js
 * Express application bootstrap with all API route registrations.
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initSentry, setupSentryErrorHandler } = require('./config/sentry')

// Sentry must be initialised before the Express app is configured
initSentry()

const app = express()

// Production-grade CORS: dev allows any localhost, production uses strict whitelist
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : [] // Dev mode uses dynamic check below

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc)
    if (!origin) return callback(null, true)

    // Development: allow any localhost port
    if (process.env.NODE_ENV !== 'production') {
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true)
      }
    }

    // Production: strict whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Blocked
    callback(new Error(`Origin ${origin} not allowed by CORS policy`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check — open this in browser to confirm API is running
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CleanFlow API is running',
    version: '1.0.0'
  })
})

// All API routes
app.use('/api/auth',        require('./routes/auth.routes'))
app.use('/api/users',       require('./routes/user.routes'))
app.use('/api/properties',  require('./routes/property.routes'))
app.use('/api/standards',   require('./routes/standard.routes'))
app.use('/api/tasks',       require('./routes/task.routes'))
app.use('/api/checklist',   require('./routes/checklist.routes'))
// Property checklist templates are per-property blueprints for future tasks.
app.use('/api/property-checklist', require('./routes/propertyChecklist.routes'))
app.use('/api/photos',      require('./routes/photo.routes'))
app.use('/api/submissions', require('./routes/submission.routes'))
app.use('/api/attendance',  require('./routes/attendance.routes'))
app.use('/api/settings',    require('./routes/settings.routes'))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` })
})

// Sentry error handler — must come AFTER routes and BEFORE the custom error handler
setupSentryErrorHandler(app)

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

module.exports = app