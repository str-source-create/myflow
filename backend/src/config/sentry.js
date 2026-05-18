/**
 * sentry.js (backend)
 * Catches every unhandled Express error and sends it to sentry.io.
 * Only active in production. Does not affect API responses or latency in development.
 *
 * Uses @sentry/node v8 API:
 *   - Sentry.init() is called BEFORE the Express app is created
 *   - setupExpressErrorHandler(app) is called AFTER all routes are registered
 *
 * Setup:
 *   1. Create a Node.js project at https://sentry.io
 *   2. Copy the DSN into backend/.env:
 *        SENTRY_DSN=https://YOUR_KEY@sentry.io/NODE_PROJECT_ID
 *        NODE_ENV=production
 */
const Sentry = require('@sentry/node')

/**
 * Call BEFORE the Express app is created.
 * In non-production environments this is a no-op.
 */
function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Scrub auth headers so tokens never reach Sentry's servers
        if (event.request?.headers?.authorization) {
          event.request.headers.authorization = '[FILTERED]'
        }
        return event
      },
    })
    console.log('[CleanFlow] Sentry backend initialised')
  }
}

/**
 * Call AFTER all routes are registered but BEFORE your custom error handler.
 * In development returns a simple pass-through middleware.
 *
 * @param {import('express').Application} app
 */
function setupSentryErrorHandler(app) {
  if (process.env.NODE_ENV === 'production') {
    // v8 API — replaces the old Sentry.Handlers.errorHandler()
    Sentry.setupExpressErrorHandler(app)
  }
}

module.exports = { initSentry, setupSentryErrorHandler }
