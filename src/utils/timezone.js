/**
 * timezone.js
 * Centralised date/time formatting for the entire app.
 *
 * Always use these functions instead of .toLocaleDateString() or .toLocaleString()
 * directly so the app honours the admin-selected timezone.
 *
 * Timezone is stored in localStorage as part of cf_settings.
 * It is fetched from the API on login and cached locally.
 */

/** Returns the active timezone string, falling back to the browser timezone. */
export const getTimezone = () => {
  try {
    const s = JSON.parse(localStorage.getItem('cf_settings') || '{}')
    return s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Fallback to the browser timezone when settings are unavailable.
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

/** Formats a date value as "May 18, 2026" using the active timezone. */
export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: getTimezone(),
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats a time value.
 * If the value is already a HH:MM string (task startTime/endTime), return as-is.
 * Otherwise formats a Date/ISO string using the active timezone.
 */
export const formatTime = (time) => {
  if (!time) return '—'
  if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) return time
  return new Date(time).toLocaleTimeString('en-US', {
    timeZone: getTimezone(),
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Formats a date+time value as "May 18, 10:30 AM" using the active timezone. */
export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    timeZone: getTimezone(),
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Returns today's date as YYYY-MM-DD in the active timezone. */
export const getTodayString = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: getTimezone() })
