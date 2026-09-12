/**
 * Product catalog mirrored from frontend/src/StaticData/static.jsx.
 * Keep in sync with the app – tests assert against these values.
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  price: string; // display price, e.g. "$1,560"
  priceValue: number; // numeric price
  reviewCount: string; // e.g. "(350)"
  keyword: string; // a distinctive search term
}

export const PRODUCTS: Product[] = [
  { id: 'product1', slug: 'rode-nt1-a-condenser-mic', name: 'Rode NT1-A Condenser Mic', price: '$240', priceValue: 240, reviewCount: '(350)', keyword: 'Rode' },
  { id: 'product2', slug: 'jbl-charge-4-bluetooth-speaker', name: 'JBL Charge 4 Bluetooth Speaker', price: '$145', priceValue: 145, reviewCount: '(500)', keyword: 'JBL' },
  { id: 'product3', slug: 'seagate-4tb-external-hard-drive', name: 'Seagate 4TB External Hard Drive', price: '$85', priceValue: 85, reviewCount: '(800)', keyword: 'Seagate' },
  { id: 'product4', slug: 'sandisk-ultra-dual-drive-32gb-usb', name: 'SanDisk Ultra Dual Drive 32GB USB 3.0', price: '$15', priceValue: 15, reviewCount: '(450)', keyword: 'Dual Drive' },
  { id: 'product5', slug: 'gopro-hero10-black', name: 'GoPro HERO10 Black', price: '$600', priceValue: 600, reviewCount: '(1200)', keyword: 'GoPro' },
  { id: 'product6', slug: 'logitech-mx-master-3-wireless-mouse', name: 'Logitech MX Master 3 Wireless Mouse', price: '$90', priceValue: 90, reviewCount: '(980)', keyword: 'Logitech' },
  { id: 'product7', slug: 'tp-link-archer-ax73-wifi-6-router', name: 'TP-Link Archer AX73 Wi-Fi 6 Router', price: '$132', priceValue: 132, reviewCount: '(600)', keyword: 'TP-Link' },
  { id: 'product8', slug: 'apple-ipad-air-2022-5th-gen', name: 'Apple iPad Air (2022, 5th Gen)', price: '$660', priceValue: 660, reviewCount: '(800)', keyword: 'iPad' },
  { id: 'product9', slug: 'samsung-32-inch-uhd-4k-smart-tv', name: 'Samsung 32-inch UHD 4K Smart TV', price: '$432', priceValue: 432, reviewCount: '(1500)', keyword: 'Samsung' },
  { id: 'product10', slug: 'apple-watch-series-7', name: 'Apple Watch Series 7', price: '$503', priceValue: 503, reviewCount: '(2000)', keyword: 'Watch' },
  { id: 'product11', slug: 'dell-xps-13-2021-laptop', name: 'Dell XPS 13 (2021) Laptop', price: '$1,560', priceValue: 1560, reviewCount: '(890)', keyword: 'Dell' },
  { id: 'product12', slug: 'sandisk-extreme-pro-usb-c-card-reader', name: 'SanDisk Extreme Pro 3.0 USB-C Memory Card Reader', price: '$36', priceValue: 36, reviewCount: '(150)', keyword: 'Card Reader' },
  { id: 'product13', slug: 'hp-laserjet-pro-mfp-m428fdw-printer', name: 'HP LaserJet Pro MFP M428fdw Wireless Printer', price: '$306', priceValue: 306, reviewCount: '(350)', keyword: 'LaserJet' },
  { id: 'product14', slug: 'epson-ef-100-smart-portable-projector', name: 'Epson EF-100 Smart Portable Projector', price: '$900', priceValue: 900, reviewCount: '(110)', keyword: 'Epson' },
];

export const PRODUCT_COUNT = PRODUCTS.length;
export const bySlug = (slug: string): Product => {
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown product slug: ${slug}`);
  return p;
};
export const byId = (id: string): Product => {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown product id: ${id}`);
  return p;
};

export const CHEAPEST = PRODUCTS.reduce((a, b) => (a.priceValue < b.priceValue ? a : b));
export const MOST_EXPENSIVE = PRODUCTS.reduce((a, b) => (a.priceValue > b.priceValue ? a : b));

/** Home page "Category Product" carousel names */
export const HOME_CATEGORY_CARDS = [
  'Smartphones',
  'Laptops',
  'Speakers',
  'Home Appliances',
  'Gaming Laptops',
  'Kitchen Appliances',
  'Bluetooth Speakers',
];

/** Max quantity per line item enforced by the UI */
export const MAX_QTY = 9;

/** Formats a number the way the app does: `$` + toLocaleString() */
export const formatPrice = (n: number) => `$${n.toLocaleString('en-US')}`;
