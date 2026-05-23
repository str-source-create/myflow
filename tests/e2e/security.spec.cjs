/**
 * security.spec.js
 * Verifies that unauthenticated users cannot access any protected page or API endpoint.
 * These tests MUST ALL PASS before any production deployment.
 *
 * What is tested:
 *   - Every protected admin route redirects to /admin/login when no token is present
 *   - Every protected worker route redirects to /worker/login when no token is present
 *   - Public routes (/admin/setup) are reachable without authentication
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

// ─── Public routes ────────────────────────────────────────────────────────────
// /admin/setup is intentionally public — first-time setup when no admin exists.
test('Public: /admin/setup is reachable without authentication', async ({ page }) => {
  await page.goto('/admin/setup')
  // Should NOT redirect to login — stays on /admin/setup or shows content
  await expect(page).not.toHaveURL(/admin\/login/)
})

// ─── Setup API is public ──────────────────────────────────────────────────────
test('API: GET /api/auth/setup-status is accessible without a token', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/auth/setup-status')
  // Returns 200 whether or not admin exists — no auth required
  expect(res.status()).toBe(200)
})
