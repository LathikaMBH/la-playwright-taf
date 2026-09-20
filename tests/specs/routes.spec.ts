import { test, expect } from '../fixtures/fixtures';

test.describe('All routes', () => {
  test.beforeEach(async ({ loggedInAdmin, routesPage }) => {
    await routesPage.open();
  });

  test('lists every route with its owner', async ({ page }) => {
    for (const name of ['Rauma 001', 'Unaja', 'Kortela 001']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/Owner: Lathika Herath/).first()).toBeVisible();
  });

  test('unassigned route shows Not started and no rider', async ({ routesPage }) => {
    const card = routesPage.routeCard('Rauma 001');
    await expect(card).toContainText('Not started');
    await expect(card).toContainText('10 stops');
    await expect(card).not.toContainText('Rider:');
  });

  test('completed route shows rider and stop count', async ({ routesPage }) => {
    const card = routesPage.routeCard('Unaja');
    await expect(card).toContainText('Rider: Dilshan');
    await expect(card).toContainText('Completed');
    await expect(card).toContainText('44 stops');
  });

  test('progress percentage is shown per route', async ({ routesPage }) => {
    await expect(routesPage.routeCard('Kortela 001')).toContainText(/\d+%/);
  });

  test('back button returns to the dashboard', async ({ page, routesPage }) => {
    await routesPage.backButton.click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('route count matches the dashboard total', async ({ page, adminPage }) => {
    const routes = await page.getByText(/\d+ stops/).count();
    await adminPage.homeTab.click();
    await expect(adminPage.routesShortcut).toContainText(`${routes} total`);
  });
});
