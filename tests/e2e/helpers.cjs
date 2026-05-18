/**
 * helpers.js
 * Shared login helpers used by every test file.
 *
 * These match the accounts created by the seed script (npm run seed inside /backend).
 * Admin:  admin@cleanflow.com / admin123
 * Worker: jessica@cleanflow.com / worker123
 */

/**
 * Log in as an admin and wait until the dashboard URL is reached.
 * Admin login uses <label> elements (no placeholder attributes).
 * @param {import('@playwright/test').Page} page
 */
async function loginAsAdmin(page) {
  await page.goto('/admin/login')
  // Use type selectors — admin inputs have no placeholder or for/id association
  await page.locator('input[type="email"]').fill('admin@cleanflow.com')
  await page.locator('input[type="password"]').fill('admin123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/admin/dashboard', { timeout: 15_000 })
}

/**
 * Log in as a worker and wait until redirected away from the login page.
 * @param {import('@playwright/test').Page} page
 */
async function loginAsWorker(page) {
  await page.goto('/worker/login')
  await page.locator('input[type="email"]').fill('jessica@cleanflow.com')
  await page.locator('input[type="password"]').fill('worker123')
  await page.getByRole('button', { name: /sign in/i }).click()
  // Wait until the URL no longer contains 'login' — confirms the API call completed
  // and React Router redirected to the worker home screen.
  // NOTE: Playwright passes a URL object (not a string) to the predicate, so use .toString().
  await page.waitForURL(url => !url.toString().includes('login'), { timeout: 15_000 })
}

module.exports = { loginAsAdmin, loginAsWorker }
