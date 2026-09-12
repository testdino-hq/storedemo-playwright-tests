import { Locator, Page } from '@playwright/test';

export class Footer {
  readonly logo: Locator;
  readonly usefulLinksTitle: Locator;
  readonly copyright: Locator;
  readonly privacyPolicy: Locator;
  readonly termsOfService: Locator;
  readonly twitter: Locator;
  readonly linkedin: Locator;
  readonly github: Locator;

  constructor(private readonly page: Page) {
    this.logo = page.getByTestId('footer-logo');
    this.usefulLinksTitle = page.getByTestId('footer-useful-links-title');
    this.copyright = page.getByTestId('footer-copyright');
    this.privacyPolicy = page.getByTestId('footer-privacy-policy');
    this.termsOfService = page.getByTestId('footer-terms-of-service');
    this.twitter = page.getByTestId('footer-twitter-icon');
    this.linkedin = page.getByTestId('footer-linkedin-icon');
    this.github = page.getByTestId('footer-github-icon');
  }

  usefulLink(name: 'home' | 'about-us' | 'contact-us' | 'all-products') {
    return this.page.getByTestId(`footer-${name}`);
  }

  policyLink(name: 'shipping-policy' | 'return-policy' | 'cancellation' | 'faq') {
    return this.page.getByTestId(`footer-policy-${name}`);
  }

  get root() {
    return this.page.locator('div.bg-black.text-white').filter({ has: this.logo });
  }
}
