import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/login';

  get title() { return this.byTestId('login-title'); }
  get description() { return this.byTestId('login-description'); }
  get emailLabel() { return this.byTestId('login-email-label'); }
  get passwordLabel() { return this.byTestId('login-password-label'); }
  get email() { return this.byTestId('login-email-input'); }
  get password() { return this.byTestId('login-password-input'); }
  get emailError() { return this.byTestId('login-email-error'); }
  get passwordError() { return this.byTestId('login-password-error'); }
  get submit() { return this.byTestId('login-submit-button'); }
  get signupLink() { return this.byTestId('login-signup-link'); }
  get passwordToggle() { return this.page.locator('#password ~ div button'); }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectLoggedIn() {
    await this.expectToast('Logged in successfully');
  }

  async expectLoaded() {
    await expect(this.title).toContainText('Sign In');
  }
}
