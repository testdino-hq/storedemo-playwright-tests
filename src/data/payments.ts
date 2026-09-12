export interface Card {
  number: string;
  name: string;
  month: string;
  year: string;
  cvv: string;
}

export const VALID_CARD: Card = { number: '4111111111111111', name: 'Dino Tester', month: '12', year: '29', cvv: '123' };
export const MASTERCARD: Card = { number: '5555555555554444', name: 'Dino Tester', month: '06', year: '30', cvv: '456' };
export const AMEX_15_DIGITS: Card = { number: '378282246310005', name: 'Dino Tester', month: '01', year: '31', cvv: '1234' };

export const BANKS = ['AXIS', 'HDFC', 'SBI', 'Kotak', 'ICICI', 'BOB', 'Punjab', 'BOI'];
export const INITIALLY_VISIBLE_BANKS = 6;

export type PaymentMethod = 'credit' | 'debit' | 'netbanking' | 'cod';
