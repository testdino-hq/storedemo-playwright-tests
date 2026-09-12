export interface Address {
  firstName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const ADDRESSES: Address[] = [
  { firstName: 'Dino Tester', email: 'dino.qa.demo@testdino.com', street: '1 Market Street', city: 'San Francisco', state: 'CA', zipCode: '94105', country: 'United States' },
  { firstName: 'Ava Stone', email: 'ava.stone@example.com', street: '221B Baker Street', city: 'London', state: 'LDN', zipCode: 'NW1 6XE', country: 'United Kingdom' },
  { firstName: 'Ravi Patel', email: 'ravi.patel@example.com', street: '12 MG Road', city: 'Bengaluru', state: 'KA', zipCode: '560001', country: 'India' },
  { firstName: 'Mia Chen', email: 'mia.chen@example.com', street: '88 Queen St W', city: 'Toronto', state: 'ON', zipCode: 'M5H 2M5', country: 'Canada' },
  { firstName: 'Liam Novak', email: 'liam.novak@example.com', street: '5 Rue de Rivoli', city: 'Paris', state: 'IDF', zipCode: '75004', country: 'France' },
];

export const uniqueAddress = (i = 0): Address => {
  const base = ADDRESSES[i % ADDRESSES.length];
  const n = Date.now().toString().slice(-6);
  return { ...base, street: `${base.street} #${n}`, zipCode: `${base.zipCode}`.replace(/\d{2}$/, n.slice(-2)) };
};

export const MAX_ADDRESSES = 4;
