import { test, expect, credentials } from '../fixtures/fixtures';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('root URL redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login page shows branding and form controls', async ({ page, loginPage }) => {
    await expect(page).toHaveTitle('KangarooPost');
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.tagline).toBeVisible();
    await expect(loginPage.emailInput).toBeEditable();
    await expect(loginPage.passwordInput).toBeEditable();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test('password field masks its input', async ({ loginPage }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('both fields are required', async ({ loginPage }) => {
    await expect(loginPage.emailInput).toHaveAttribute('required', '');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });

  test('empty submit stays on /login without a server error', async ({ page, loginPage }) => {
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.errorMessage).toBeHidden();
  });

  test('email without @ is rejected by the browser', async ({ page, loginPage }) => {
    await loginPage.login('not-an-email', 'whatever');
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.errorMessage).toBeHidden();
    const valid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });

  test('unknown user shows "Invalid credentials"', async ({ page, loginPage }) => {
    await loginPage.login('nobody@example.com', 'wrong-password');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('valid email with wrong password shows "Invalid credentials"', async ({ page, loginPage }) => {
    await loginPage.login(credentials.email, 'definitely-wrong');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('admin can sign in and lands on the admin panel', async ({ page, loginPage, adminPage }) => {
    await loginPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(adminPage.welcomeHeading).toBeVisible();
  });
});

test.describe('Access control', () => {
  for (const path of ['/admin', '/admin/owners', '/admin/routes']) {
    test(`${path} redirects to /login when logged out`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
