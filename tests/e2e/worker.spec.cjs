/**
 * worker.spec.js
 * Automated end-to-end tests for the CleanFlow worker mobile app.
 *
 * Prerequisites:
 *   - Backend running on port 3000
 *   - Frontend running on port 5173
 *   - Seed data present (run: cd backend && npm run seed)
 */
const { test, expect } = require('@playwright/test')
const { loginAsWorker } = require('./helpers')

// ─── Worker Login ────────────────────────────────────────────────────────────
test.describe('Worker Login', () => {
  test('login page loads with email field', async ({ page }) => {
    await page.goto('/worker/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('wrong password shows an error message', async ({ page }) => {
    await page.goto('/worker/login')
    // Use a non-existent email so failed attempts never accumulate against the
    // real seed account across parallel projects or repeated test runs.
    await page.locator('input[type="email"]').fill('nobody@cleanflow.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Backend returns 'Invalid email or password' (not 'Incorrect')
    await expect(page.getByText(/invalid/i)).toBeVisible()
  })

  test('correct login redirects away from login page', async ({ page }) => {
    await loginAsWorker(page)
    await expect(page).not.toHaveURL(/login/)
  })

  test('logout returns to worker login page', async ({ page }) => {
    await loginAsWorker(page)
    await page.goto('/worker/profile')
    // Wait for profile page to load before looking for the logout button
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL(/worker\/login/)
  })
})

// ─── Worker Home ─────────────────────────────────────────────────────────────
test.describe('Worker Home', () => {
  test('home screen shows the worker name', async ({ page }) => {
    await loginAsWorker(page)
    await expect(page.getByText(/jessica/i)).toBeVisible()
  })

  test('bottom navigation tabs are visible', async ({ page }) => {
    await loginAsWorker(page)
    await expect(page.getByText(/home/i).first()).toBeVisible()
    await expect(page.getByText(/history/i).first()).toBeVisible()
    await expect(page.getByText(/profile/i).first()).toBeVisible()
  })
})

// ─── Worker — No Before Photos ───────────────────────────────────────────────
test.describe('Worker — Before Photos removed', () => {
  test('"Before Photos" section must not appear on the worker side', async ({ page }) => {
    await loginAsWorker(page)
    // "Before Photos" was deprecated and must not be visible to workers
    await expect(page.getByText(/before photos/i)).not.toBeVisible()
  })
})

// ─── Worker Time Clock ───────────────────────────────────────────────────────
test.describe('Worker Time Clock', () => {
  test('time-clock route is reachable without redirecting to login', async ({ page }) => {
    await loginAsWorker(page)
    await page.goto('/worker/time-clock')
    await expect(page).not.toHaveURL(/login/)
  })
})

// ─── Mobile Viewport Tests ───────────────────────────────────────────────────
test.describe('Worker Mobile (375 px viewport)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('no horizontal scroll on the home screen', async ({ page }) => {
    await loginAsWorker(page)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    // Allow a tiny extra pixel of rounding — must not be significantly wider
    expect(scrollWidth).toBeLessThanOrEqual(380)
  })

  test('no horizontal scroll on the login page', async ({ page }) => {
    await page.goto('/worker/login')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(380)
  })
})
