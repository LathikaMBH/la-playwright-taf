import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class RoutesPage extends BasePage {
  readonly heading: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'All Routes' });
    this.backButton = page.locator('button.back-btn');
  }

  async open(): Promise<void> {
    await this.page.goto('/admin/routes');
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Card for a route: the innermost block holding its name, owner line and stop count. */
  routeCard(name: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .filter({ hasText: 'Owner:' })
      .filter({ hasText: /stops/ })
      .last();
  }
}
