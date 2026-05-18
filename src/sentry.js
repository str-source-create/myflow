/**
 * sentry.js
 * Catches every unhandled JavaScript error and sends a report to sentry.io.
 * Works silently — users never see anything Sentry-related.
 * Only runs in production, not in local development.
 *
 * Setup:
 *   1. Create a free account at https://sentry.io
 *   2. Create a new React project there
 *   3. Copy the DSN into your root .env:
 *        VITE_SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
 */
import * as Sentry from '@sentry/react'

export function initSentry() {
  // Only initialise in production builds — never clutters dev console
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      tracesSampleRate: 1.0,            // capture 100% of traces
      environment: import.meta.env.MODE, // "production" | "staging" etc.
      beforeSend(event) {
        // Strip auth tokens before sending so secrets never leave the browser
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['authorization']
        }
        return event
      },
    })
  }
}

/**
 * Call after a successful login to attach the user to every future error report.
 * Call with null on logout to clear the context.
 */
export function setUserContext(user) {
  if (user) {
    Sentry.setUser({
      id:    user._id || user.id,
      email: user.email,
      role:  user.role,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Manually capture an error with optional extra context.
 * Use this in catch blocks where you want to add metadata:
 *   captureError(err, { taskId, photoId })
 */
export function captureError(error, context = {}) {
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v))
    Sentry.captureException(error)
  })
}

export { Sentry }
