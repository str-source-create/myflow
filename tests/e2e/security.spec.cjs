/**
 * security.spec.js
 * Verifies that unauthenticated users cannot access any protected page or API endpoint.
 * These tests MUST ALL PASS before any production deployment.
 *
 * What is tested:
 *   - Every protected admin route redirects to /admin/login when no token is present
 *   - Every protected worker route redirects to /worker/login when no token is present
 *   - API endpoints return 401 when called without a token
 *   - API endpoints return 401 when called with a fake/invalid token
 */
const { test, expect } = require('@playwright/test')

// ─── Admin routes that must redirect unauthenticated visitors ───────────────
const protectedAdminRoutes = [
  '/admin/dashboard',
  '/admin/properties',
  '/admin/tasks',
  '/admin/submissions',
  '/admin/workers',
  '/admin/calendar',
  '/admin/attendance',
]

// ─── Worker routes that must redirect unauthenticated visitors ───────────────
const protectedWorkerRoutes = [
  '/worker/',
  '/worker/history',
  '/worker/profile',
  '/worker/time-clock',
]

// Generate one test per protected admin route
for (const route of protectedAdminRoutes) {
  test(`Admin: ${route} redirects to login when unauthenticated`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(/admin\/login/)
  })
}

// Generate one test per protected worker route
for (const route of protectedWorkerRoutes) {
  test(`Worker: ${route} redirects to login when unauthenticated`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(/worker\/login/)
  })
}

// ─── API security ────────────────────────────────────────────────────────────
test('API: GET /api/tasks with no token returns 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/tasks')
  expect(res.status()).toBe(401)
  const body = await res.json()
  expect(body.success).toBe(false)
})

test('API: GET /api/properties with no token returns 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/properties')
  expect(res.status()).toBe(401)
})

test('API: GET /api/properties with fake token returns 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/properties', {
    headers: { Authorization: 'Bearer fake_token_xyz_invalid' },
  })
  expect(res.status()).toBe(401)
})

test('API: GET /api/users with no token returns 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/users')
  expect(res.status()).toBe(401)
})
