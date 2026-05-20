/**
 * admin.spec.js
 * Automated end-to-end tests for the CleanFlow admin portal.
 *
 * Prerequisites:
 *   - Backend running on port 3000
 *   - Frontend running on port 5173
 *   - Seed data present (run: cd backend && npm run seed)
 */
const { test, expect } = require('@playwright/test')
const { loginAsAdmin } = require('./helpers')

// ─── Admin Login ─────────────────────────────────────────────────────────────
test.describe('Admin Login', () => {
  test('login page loads with email field', async ({ page }) => {
    await page.goto('/admin/login')
    // Admin login has no placeholder — use the input type selector
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('wrong password shows an error message', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@cleanflow.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Backend returns 'Invalid email or password' (not 'Incorrect')
    await expect(page.getByText(/invalid/i)).toBeVisible()
  })

  test('correct credentials reach the dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/admin\/dashboard/)
  })

  test('logout returns to the login page', async ({ page }) => {
    await loginAsAdmin(page)
    // Use viewport width to determine mobile vs desktop — avoids timing issues
    // with DOM visibility checks. Tailwind's md: breakpoint is 768 px.
    const { width } = page.viewportSize()
    if (width < 768) {
      // Mobile: sidebar is inside a closed drawer — open it first
      await page.locator('header button').first().click()
      // Wait for the drawer backdrop button to mount (confirms React setState ran)
      await page.locator('[aria-label="Close drawer"]').waitFor({ state: 'attached' })
      // The sidebar panel is the div immediately after the backdrop button
      await page.locator('[aria-label="Close drawer"] + div')
        .getByRole('button', { name: /log out/i })
        .click()
    } else {
      // Desktop: the fixed <aside> sidebar is always in view
      await page.locator('aside').getByRole('button', { name: /log out/i }).click()
    }
    await expect(page).toHaveURL(/admin\/login/)
  })
})

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
test.describe('Admin Dashboard', () => {
  test('stat cards are visible', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText(/jobs today/i)).toBeVisible()
    // Use .first() — 'pending reviews' appears in stat card AND in empty-state text
    await expect(page.getByText(/pending reviews/i).first()).toBeVisible()
  })
})

// ─── Admin Properties ────────────────────────────────────────────────────────
test.describe('Admin Properties', () => {
  test('properties page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/properties')
    // Target the <h1> heading — sidebar nav links are hidden on mobile viewports
    await expect(page.getByRole('heading', { name: /properties/i, level: 1 })).toBeVisible()
  })

  test('add property form validates required fields', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/properties/add')
    await page.getByRole('button', { name: /save/i }).click()
    // Should stay on the form — required-field validation prevents navigation
    await expect(page).toHaveURL(/properties\/add/)
  })
})

// ─── Admin Tasks ─────────────────────────────────────────────────────────────
test.describe('Admin Tasks', () => {
  test('tasks page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/tasks')
    await expect(page.getByRole('heading', { name: /tasks/i, level: 1 })).toBeVisible()
  })

  test('legacy create task route redirects to calendar', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/tasks/create')
    // Task creation is centralized in calendar.
    await expect(page).toHaveURL(/admin\/calendar/)
  })
})

// ─── Admin Calendar ──────────────────────────────────────────────────────────
test.describe('Admin Calendar', () => {
  test('calendar page loads with date navigation', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/calendar')
    // Calendar nav uses Previous/Next Week buttons (no standalone 'Today' button)
    await expect(page.getByRole('button', { name: /previous week/i })).toBeVisible()
  })
})

// ─── Admin Submissions ───────────────────────────────────────────────────────
test.describe('Admin Submissions', () => {
  test('submissions page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/submissions')
    await expect(page.getByRole('heading', { name: /submissions/i, level: 1 })).toBeVisible()
  })
})

// ─── Admin Attendance ────────────────────────────────────────────────────────
test.describe('Admin Attendance', () => {
  test('attendance page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/attendance')
    // h1 says "Employee Attendance"
    await expect(page.getByRole('heading', { name: /attendance/i, level: 1 })).toBeVisible()
  })
})
