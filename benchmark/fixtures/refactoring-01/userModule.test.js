const assert = require('node:assert');
const { isValidEmail, isValidPhone, isValidPostalCode } = require('./userModule');

assert.strictEqual(isValidEmail(' a@b.com '), true);
assert.strictEqual(isValidEmail('not-an-email'), false);
assert.strictEqual(isValidPhone('(555) 123-4567'), true);
assert.strictEqual(isValidPostalCode('90210'), true);
assert.strictEqual(isValidPostalCode('90210-1234'), false);

console.log('userModule tests passed');
