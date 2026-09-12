import { BasePage } from './BasePage';

export class ContactUsPage extends BasePage {
  readonly path = '/contact-us';

  get heading() { return this.byTestId('contact-us-heading'); }
  get getInTouch() { return this.byTestId('contact-us-get-in-touch'); }
  get form() { return this.byTestId('contact-us-form'); }
  get firstName() { return this.byTestId('contact-us-first-name-input'); }
  get lastName() { return this.byTestId('contact-us-last-name-input'); }
  get subject() { return this.byTestId('contact-us-subject-input'); }
  get message() { return this.byTestId('contact-us-message-input'); }
  get submit() { return this.byTestId('contact-us-submit-button'); }
  get subjectError() { return this.byTestId('contact-us-subject-error'); }
  get messageError() { return this.byTestId('contact-us-message-error'); }
  get success() { return this.byTestId('contact-us-success-message'); }
  get firstNameError() { return this.page.getByText('First Name is required.'); }
  get lastNameError() { return this.page.getByText('Last Name is required.'); }

  async fill(d: { firstName?: string; lastName?: string; subject?: string; message?: string }) {
    if (d.firstName !== undefined) await this.firstName.fill(d.firstName);
    if (d.lastName !== undefined) await this.lastName.fill(d.lastName);
    if (d.subject !== undefined) await this.subject.fill(d.subject);
    if (d.message !== undefined) await this.message.fill(d.message);
  }
}
