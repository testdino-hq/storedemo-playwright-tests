export interface Credentials {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
}

/** Shared, pre-provisioned account used by read-only authenticated tests. */
export const DEMO_USER: Credentials = {
  email: process.env.DEMO_USER_EMAIL || 'dino.qa.demo@testdino.com',
  password: process.env.DEMO_USER_PASSWORD || 'Dino@12345',
  firstname: 'Dino',
  lastname: 'Tester',
};

export const INVALID_USER: Credentials = {
  email: 'nobody.here.404@testdino.com',
  password: 'WrongPass@123',
};

export const uniqueEmail = (prefix = 'pw') =>
  `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@testdino-qa.com`;

export const newUser = (prefix = 'pw'): Required<Credentials> => ({
  email: uniqueEmail(prefix),
  password: 'Str0ng!Pass',
  firstname: 'Play',
  lastname: 'Wright',
});

/** Email format edge cases (client-side regex: /\S+@\S+\.\S+/ on login, stricter on signup) */
export const INVALID_EMAILS = ['plainaddress', 'missing@domain', '@nodomain.com', 'spaces in@mail.com', 'double@@at.com'];
export const VALID_EMAILS = ['first.last@example.com', 'user+tag@sub.domain.org', 'UPPER@CASE.COM', 'a@b.io'];
