const assert = require('node:assert');
const { isValidEmail, isValidPhone, isValidPostalCode } = require('./contactModule');

assert.strictEqual(isValidEmail(' a@b.com '), true);
assert.strictEqual(isValidPhone('555.123.4567'), true);
assert.strictEqual(isValidPostalCode('90210'), true);

console.log('contactModule tests passed');
