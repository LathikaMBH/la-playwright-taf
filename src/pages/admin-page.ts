import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export type RouteStatus = 'Not started' | 'In progress' | 'Paused' | 'Completed';

export class AdminPage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly adminPanelLabel: Locator;
  readonly bottomNav: Locator;
  readonly homeTab: Locator;
  readonly ownersTab: Locator;
  readonly routesTab: Locator;
  readonly logoutTab: Locator;
  readonly headerLogoutButton: Locator;
  readonly ownersShortcut: Locator;
  readonly routesShortcut: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.getByRole('heading', { name: 'Welcome, Admin' });
    this.adminPanelLabel = page.getByText('Admin Panel', { exact: true });
    this.bottomNav = page.getByRole('navigation');
    this.homeTab = this.bottomNav.getByRole('button', { name: 'Home' });
    this.ownersTab = this.bottomNav.getByRole('button', { name: 'Owners' });
    this.routesTab = this.bottomNav.getByRole('button', { name: 'Routes' });
    this.logoutTab = this.bottomNav.getByRole('button', { name: 'Logout' });
    // Unlabeled icon button beside the welcome heading (outside the bottom nav)
    this.headerLogoutButton = page
      .locator('button')
      .filter({ has: page.locator('i[class*="logout"]') })
      .and(page.locator(':not(nav button)'))
      .first();
    this.ownersShortcut = page.getByRole('button', { name: /Route Owners \d+ accounts/ });
    this.routesShortcut = page.getByRole('button', { name: /All Routes \d+ total/ });
  }

  /** Route status tile button, e.g. statusTile('Completed'). */
  statusTile(status: RouteStatus): Locator {
    return this.page.getByRole('button', { name: new RegExp(`\\d+ ${status}$`) });
  }

  async statusCount(status: RouteStatus): Promise<number> {
    const text = (await this.statusTile(status).innerText()).trim();
    return parseInt(text, 10);
  }

  async logout(): Promise<void> {
    await this.click(this.logoutTab);
  }
}
