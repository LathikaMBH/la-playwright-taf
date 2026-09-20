import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class OwnersPage extends BasePage {
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly addButton: Locator;
  readonly deleteButtons: Locator;

  // New owner form
  readonly formTitle: Locator;
  readonly fullNameInput: Locator;
  readonly cityInput: Locator;
  readonly countryCodeSelect: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly showPasswordButton: Locator;
  readonly generatePasswordButton: Locator;
  readonly copyButton: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Route Owners' });
    this.backButton = page.locator('button.back-btn');
    this.addButton = page.locator('button:has(i.ti-plus)');
    this.deleteButtons = page.getByRole('button', { name: 'Delete owner' });

    this.formTitle = page.getByText('New Route Owner');
    this.fullNameInput = page.getByRole('textbox', { name: 'Full name *' });
    this.cityInput = page.getByRole('textbox', { name: 'City' });
    this.countryCodeSelect = page.getByRole('combobox', { name: 'Country code' });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone number' });
    this.emailInput = page.getByRole('textbox', { name: 'Email address *' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password *' });
    this.showPasswordButton = page.getByRole('button', { name: 'Show password' });
    this.generatePasswordButton = page.getByRole('button', { name: /Generate password/ });
    this.copyButton = page.getByRole('button', { name: /Copy/ });
    this.createButton = page.getByRole('button', { name: 'Create Route Owner' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async open(): Promise<void> {
    await this.page.goto('/admin/owners');
    await this.heading.waitFor({ state: 'visible' });
  }

  /** The innermost card containing the owner's name and a delete button. */
  ownerCard(name: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: name })
      .filter({ has: this.deleteButtons })
      .last();
  }

  async openNewOwnerForm(): Promise<void> {
    await this.click(this.addButton);
    await this.formTitle.waitFor({ state: 'visible' });
  }
}
