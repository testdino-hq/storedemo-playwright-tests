import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  path = '/product/';

  constructor(page: ConstructorParameters<typeof BasePage>[0], slug?: string) {
    super(page);
    if (slug) this.path = `/product/${slug}`;
  }

  /**
   * KNOWN BUG: a hard load of /product/:slug returns a blank page because index.html
   * uses relative asset paths. We use the app's own `?redirect=` deep-link mechanism
   * (see App.jsx) so the SPA router handles the route client-side.
   */
  async gotoSlug(slug: string) {
    this.path = `/product/${slug}`;
    await this.page.goto(`/?redirect=${encodeURIComponent(this.path)}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(new RegExp(`/product/${slug}$`));
    await expect(this.name).toBeVisible();
    return this;
  }

  /** Hard-loads the deep link directly (exercises the known bug). */
  async gotoSlugDirect(slug: string) {
    this.path = `/product/${slug}`;
    return this.goto();
  }

  get section() { return this.byTestId('product-details-section'); }
  get image() { return this.byTestId('product-image'); }
  get name() { return this.byTestId('product-name'); }
  get description() { return this.byTestId('product-description'); }
  get rating() { return this.byTestId('product-rating'); }
  get reviewCount() { return this.byTestId('product-review-count'); }
  get price() { return this.byTestId('product-price'); }
  get variantImages() { return this.byTestId('product-variant-image'); }
  get viewImages() { return this.byTestId('product-view-image'); }
  get quantityLabel() { return this.byTestId('quantity-label'); }
  get quantityValue() { return this.byTestId('quantity-value'); }
  get quantityMinus() { return this.page.locator('.anticon-minus').first(); }
  get quantityPlus() { return this.page.locator('.anticon-plus').first(); }
  get addToCart() { return this.byTestId('add-to-cart-button'); }
  get buyNow() { return this.byTestId('buy-now-button'); }
  get descriptionTab() { return this.byTestId('description-tab'); }
  get additionalInfoTab() { return this.byTestId('additional-info-tab'); }
  get reviewsTab() { return this.byTestId('reviews-tab'); }
  get descriptionContent() { return this.byTestId('description-content'); }
  get featuresTitle() { return this.byTestId('additional-info-features-title'); }
  get highlightTitle() { return this.byTestId('additional-info-highlight-title'); }
  get highlights() { return this.byTestId('additional-info-highlight'); }
  get writeReviewButton() { return this.byTestId('write-review-button'); }
  get noReviewsMessage() { return this.byTestId('no-reviews-message'); }
  get reviewForm() { return this.byTestId('review-form'); }
  get reviewName() { return this.byTestId('review-form-name-input'); }
  get reviewEmail() { return this.byTestId('review-form-email-input'); }
  get reviewTitle() { return this.byTestId('review-form-title-input'); }
  get reviewBody() { return this.byTestId('review-form-review-input'); }
  get reviewSubmit() { return this.byTestId('review-form-submit-button'); }
  get reviewCancel() { return this.byTestId('review-form-cancel-button'); }
  get reviewNames() { return this.byTestId('review-name'); }
  get reviewTitles() { return this.byTestId('review-title'); }
  get reviewContents() { return this.byTestId('review-content'); }
  get editReviewButtons() { return this.byTestId('edit-review-button'); }
  get deleteReviewButtons() { return this.byTestId('delete-review-button'); }
  get youMayAlsoLike() { return this.byTestId('you-may-also-like-title'); }
  get relatedCards() { return this.page.locator('.slick-slide.slick-active').getByTestId('feature-card-header'); }
  get notFoundText() { return this.page.getByText('Product not found'); }

  reviewStar(n: 1 | 2 | 3 | 4 | 5) { return this.byTestId(`review-form-rating-${n}`); }

  async setQuantity(n: number) {
    const current = Number(await this.quantityValue.textContent());
    const diff = n - current;
    const btn = diff > 0 ? this.quantityPlus : this.quantityMinus;
    for (let i = 0; i < Math.abs(diff); i++) await btn.click();
    await expect(this.quantityValue).toHaveText(String(n));
  }

  async openReviews() {
    await this.reviewsTab.click();
    await expect(this.writeReviewButton).toBeVisible();
  }

  async submitReview(r: { name: string; email: string; title: string; review: string; rating?: 1 | 2 | 3 | 4 | 5 }) {
    await this.openReviews();
    if (!(await this.reviewForm.isVisible())) await this.writeReviewButton.click();
    await expect(this.reviewForm).toBeVisible();
    await this.reviewName.fill(r.name);
    await this.reviewEmail.fill(r.email);
    await this.reviewTitle.fill(r.title);
    await this.reviewBody.fill(r.review);
    if (r.rating) await this.reviewStar(r.rating).click();
    await this.reviewSubmit.click();
  }
}
