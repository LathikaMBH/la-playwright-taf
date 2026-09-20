import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly tagline: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'KangarooPost', level: 1 });
    this.tagline = page.getByText('Precision delivery, every street');
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.signInButton = page.getByRole('button', { name: /Sign In/ });
    this.errorMessage = page.getByText('Invalid credentials');
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.signInButton);
  }
}
