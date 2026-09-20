import { test, expect } from '../fixtures/fixtures';

test.describe('Navigation and session', () => {
  test('bottom tabs switch between Home, Owners and Routes', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.ownersTab.click();
    await expect(page).toHaveURL(/\/admin\/owners$/);

    await loggedInAdmin.routesTab.click();
    await expect(page).toHaveURL(/\/admin\/routes$/);

    await loggedInAdmin.homeTab.click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(loggedInAdmin.welcomeHeading).toBeVisible();
  });

  test('bottom nav logout returns to /login', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.logout();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('header logout button returns to /login', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.headerLogoutButton.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('after logout, /admin is no longer accessible', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.logout();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('session survives a page reload', async ({ page, loggedInAdmin }) => {
    await page.reload();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(loggedInAdmin.welcomeHeading).toBeVisible();
  });
});
