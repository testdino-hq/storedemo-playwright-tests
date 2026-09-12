import { expect, Locator, Page } from '@playwright/test';

/** Site-wide header (desktop + mobile menu). */
export class Header {
  readonly logo: Locator;
  readonly menuHome: Locator;
  readonly menuAbout: Locator;
  readonly menuContact: Locator;
  readonly menuProducts: Locator;
  readonly wishlistButton: Locator;
  readonly wishlistCount: Locator;
  readonly cartIcon: Locator;
  readonly cartCount: Locator;
  readonly userIcon: Locator;
  readonly mobileMenuToggle: Locator;

  constructor(private readonly page: Page) {
    this.logo = page.getByTestId('header-logo');
    this.menuHome = page.getByTestId('header-menu-home').first();
    this.menuAbout = page.getByTestId('header-menu-about-us').first();
    this.menuContact = page.getByTestId('header-menu-contact-us').first();
    this.menuProducts = page.getByTestId('header-menu-all-products').first();
    this.wishlistButton = page.getByTestId('header-wishlist-button').first();
    this.wishlistCount = page.getByTestId('header-wishlist-count').first();
    this.cartIcon = page.getByTestId('header-cart-icon').first();
    this.cartCount = page.getByTestId('header-cart-count').first();
    this.userIcon = page.getByTestId('header-user-icon').first();
    this.mobileMenuToggle = page.getByTestId('header-menu-icon');
  }

  async openCart() {
    await this.cartIcon.click();
    await expect(this.page.getByTestId('cart-drawer')).toHaveClass(/translate-x-0/);
  }

  async openMobileMenu() {
    await this.mobileMenuToggle.click();
    await expect(this.page.getByTestId('header-menu-home').last()).toBeVisible();
  }

  async expectCartCount(n: number) {
    if (n === 0) await expect(this.cartCount).toHaveCount(0);
    else await expect(this.cartCount).toHaveText(String(n));
  }

  async expectWishlistCount(n: number) {
    if (n === 0) await expect(this.wishlistCount).toHaveCount(0);
    else await expect(this.wishlistCount).toHaveText(String(n));
  }
}
