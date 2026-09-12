import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SignupPage extends BasePage {
  readonly path = '/signup';

  get title() { return this.byTestId('signup-title'); }
  get description() { return this.byTestId('signup-description'); }
  get firstname() { return this.byTestId('signup-firstname-input'); }
  get lastname() { return this.byTestId('signup-lastname-input'); }
  get email() { return this.byTestId('signup-email-input'); }
  get password() { return this.byTestId('signup-password-input'); }
  get passwordToggle() { return this.byTestId('signup-password-toggle'); }
  get submit() { return this.byTestId('signup-submit-button'); }
  get loginLink() { return this.byTestId('signup-login-link'); }
  get terms() { return this.byTestId('signup-terms-and-conditions'); }
  get termsLink() { return this.byTestId('signup-terms-of-service-link'); }
  get privacyLink() { return this.byTestId('signup-privacy-policy-link'); }
  get strengthLabel() { return this.page.getByText('Password Strength:').locator('..').locator('span').last(); }
  get hint() { return this.page.getByText('Password must be at least 6 characters long'); }

  async fillForm(u: { firstname?: string; lastname?: string; email?: string; password?: string }) {
    if (u.firstname !== undefined) await this.firstname.fill(u.firstname);
    if (u.lastname !== undefined) await this.lastname.fill(u.lastname);
    if (u.email !== undefined) await this.email.fill(u.email);
    if (u.password !== undefined) await this.password.fill(u.password);
  }

  async signup(u: { firstname: string; lastname: string; email: string; password: string }) {
    await this.fillForm(u);
    await this.submit.click();
  }

  async expectLoaded() {
    await expect(this.title).toContainText('Create Account');
  }
}
