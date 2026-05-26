/**
 * app.js
 * Express application bootstrap with all API route registrations.
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { initSentry, setupSentryErrorHandler } = require('./config/sentry')

// Sentry must be initialised before the Express app is configured
initSentry()

const app = express()

/**
 * CORS configuration — production grade.
 *
 * Accepts requests from:
 * 1. localhost (local development)
 * 2. Any *.coolify.app subdomain (Coolify deployment)
 * 3. Any *.vercel.app subdomain (if frontend is on Vercel)
 * 4. FRONTEND_URL from environment variable (custom domain)
 * 5. ngrok domains (for mobile testing)
 *
 * In production set FRONTEND_URL to your actual domain.
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true)

    const allowedPatterns = [
      /^https?:\/\/localhost/,
      /\.coolify\.app$/,
      /\.vercel\.app$/,
      /\.ngrok-free\.app$/,
      /\.ngrok\.io$/,
      /\.onrender\.com$/,
    ]

    const explicitAllowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean)

    const isAllowed =
      explicitAllowed.includes(origin) ||
      allowedPatterns.some(pattern => pattern.test(origin))

    if (isAllowed) {
      callback(null, true)
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`)
      callback(null, false) // Don't throw — just block silently
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**
 * Login rate limiter.
 * Allows 10 login attempts per IP per 15 minutes.
 * After 10 failures the client receives 429 Too Many Requests.
 * This prevents automated brute-force password attacks.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window per IP
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes and try again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Health check endpoint.
 * Coolify uses this to verify the app is running correctly.
 * Must return 200 OK with a JSON response.
 * Route: GET /
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CleanFlow API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Rate limiter applied to login in production only.
// Dev / CI test suites fire many concurrent logins that would quickly exhaust
// the 10-req window and cause false 429 failures.
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', loginLimiter)
}

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