import { test, expect } from '../fixtures/fixtures';

const statuses = ['Not started', 'In progress', 'Paused', 'Completed'] as const;

test.describe('Admin dashboard', () => {
  test('shows welcome header and admin panel label', async ({ loggedInAdmin }) => {
    await expect(loggedInAdmin.adminPanelLabel).toBeVisible();
    await expect(loggedInAdmin.welcomeHeading).toBeVisible();
  });

  test('shows summary tiles for owners, riders and routes', async ({ page, loggedInAdmin }) => {
    for (const label of ['Owners', 'Riders', 'Routes']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('shows all four route status tiles', async ({ loggedInAdmin }) => {
    for (const s of statuses) {
      await expect(loggedInAdmin.statusTile(s)).toBeVisible();
    }
  });

  test('route table has the expected columns', async ({ page, loggedInAdmin }) => {
    // Headers are uppercased by CSS, so match case-insensitively
    for (const col of ['Route', 'No.', 'Owner', 'Rider', 'Status']) {
      await expect(page.getByText(new RegExp(`^${col.replace('.', '\\.')}$`, 'i')).first()).toBeVisible();
    }
  });

  test('status tile totals match the "All Routes" total', async ({ loggedInAdmin }) => {
    let total = 0;
    for (const s of statuses) total += await loggedInAdmin.statusCount(s);
    await expect(loggedInAdmin.routesShortcut).toContainText(`${total} total`);
  });

  test('"Route Owners" shortcut opens the owners page', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.ownersShortcut.click();
    await expect(page).toHaveURL(/\/admin\/owners$/);
  });

  test('"All Routes" shortcut opens the routes page', async ({ page, loggedInAdmin }) => {
    await loggedInAdmin.routesShortcut.click();
    await expect(page).toHaveURL(/\/admin\/routes$/);
  });
});
