import { test, expect } from '../fixtures/fixtures';

// Read-only: the New Route Owner form is opened and cancelled, never submitted,
// because the app runs against live data.
test.describe('Route owners', () => {
  test.beforeEach(async ({ loggedInAdmin, ownersPage }) => {
    await ownersPage.open();
  });

  test('lists an owner with contact details and action buttons', async ({ ownersPage }) => {
    const card = ownersPage.ownerCard('Lathika Herath');
    await expect(card).toContainText('lathika.mbh@gmail.com');
    await expect(card).toContainText('Rauma');
    await expect(card).toContainText('+358417419350');
    await expect(card).toContainText('3 routes');
    await expect(card).toContainText('1/5 riders');
    for (const name of [/Riders/, /Routes/, /Edit/, /Password/, 'Delete owner']) {
      await expect(card.getByRole('button', { name })).toBeVisible();
    }
  });

  test('owner count matches the dashboard', async ({ ownersPage, adminPage }) => {
    await expect(ownersPage.deleteButtons.first()).toBeVisible();
    const owners = await ownersPage.deleteButtons.count();
    await adminPage.homeTab.click();
    await expect(adminPage.ownersShortcut).toContainText(`${owners} accounts`);
  });

  test('back button returns to the dashboard', async ({ page, ownersPage }) => {
    await ownersPage.backButton.click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('+ opens the New Route Owner form with all fields', async ({ ownersPage }) => {
    await ownersPage.openNewOwnerForm();
    await expect(ownersPage.fullNameInput).toBeVisible();
    await expect(ownersPage.cityInput).toBeVisible();
    await expect(ownersPage.countryCodeSelect).toBeVisible();
    await expect(ownersPage.phoneInput).toBeVisible();
    await expect(ownersPage.emailInput).toBeVisible();
    await expect(ownersPage.passwordInput).toBeVisible();
    await expect(ownersPage.createButton).toBeVisible();
  });

  test('country code defaults to FI +358 and offers many countries', async ({ ownersPage }) => {
    await ownersPage.openNewOwnerForm();
    await expect(ownersPage.countryCodeSelect.locator('option:checked')).toHaveText('FI +358');
    expect(await ownersPage.countryCodeSelect.locator('option').count()).toBeGreaterThan(50);
  });

  test('Copy is disabled until a password is generated', async ({ ownersPage }) => {
    await ownersPage.openNewOwnerForm();
    await expect(ownersPage.copyButton).toBeDisabled();
    await ownersPage.generatePasswordButton.click();
    await expect(ownersPage.passwordInput).not.toHaveValue('');
    await expect(ownersPage.copyButton).toBeEnabled();
  });

  test('show password toggles the password field type', async ({ ownersPage }) => {
    await ownersPage.openNewOwnerForm();
    await ownersPage.passwordInput.fill('Secret123!');
    await expect(ownersPage.passwordInput).toHaveAttribute('type', 'password');
    await ownersPage.showPasswordButton.click();
    await expect(ownersPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('cancel closes the form without adding an owner', async ({ page, ownersPage }) => {
    await expect(ownersPage.deleteButtons.first()).toBeVisible();
    const before = await ownersPage.deleteButtons.count();
    await ownersPage.openNewOwnerForm();
    await ownersPage.fullNameInput.fill('Should Not Be Saved');
    await ownersPage.cancelButton.click();
    await expect(ownersPage.formTitle).toBeHidden();
    await expect(page.getByText('Should Not Be Saved')).toHaveCount(0);
    await expect(ownersPage.deleteButtons).toHaveCount(before);
  });

  test('create with empty required fields keeps the form open', async ({ ownersPage }) => {
    await expect(ownersPage.deleteButtons.first()).toBeVisible();
    const before = await ownersPage.deleteButtons.count();
    await ownersPage.openNewOwnerForm();
    await ownersPage.createButton.click();
    await expect(ownersPage.formTitle).toBeVisible();
    await expect(ownersPage.deleteButtons).toHaveCount(before);
  });
});
