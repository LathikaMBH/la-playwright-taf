import { test as base } from '@playwright/test';
import { LoginPage } from '../../src/pages/login-page';
import { AdminPage } from '../../src/pages/admin-page';
import { OwnersPage } from '../../src/pages/owners-page';
import { RoutesPage } from '../../src/pages/routes-page';

export const credentials = {
  email: process.env.APP_EMAIL ?? '',
  password: process.env.APP_PASSWORD ?? '',
};

type Fixtures = {
  loginPage: LoginPage;
  adminPage: AdminPage;
  ownersPage: OwnersPage;
  routesPage: RoutesPage;
  /** Logs in as admin through the UI and returns the AdminPage. */
  loggedInAdmin: AdminPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  adminPage: async ({ page }, use) => use(new AdminPage(page)),
  ownersPage: async ({ page }, use) => use(new OwnersPage(page)),
  routesPage: async ({ page }, use) => use(new RoutesPage(page)),
  loggedInAdmin: async ({ page, loginPage, adminPage }, use) => {
    await loginPage.open();
    await loginPage.login(credentials.email, credentials.password);
    await page.waitForURL('**/admin');
    await use(adminPage);
  },
});

export { expect } from '@playwright/test';
