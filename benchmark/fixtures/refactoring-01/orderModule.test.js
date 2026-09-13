const assert = require('node:assert');
const { isValidEmail, isValidPhone, isValidPostalCode } = require('./orderModule');

assert.strictEqual(isValidEmail('a@b.com'), true);
assert.strictEqual(isValidPhone('(555) 123-4567'), true);
assert.strictEqual(isValidPostalCode('90210'), true);
assert.strictEqual(isValidPostalCode('90210-1234'), true);

console.log('orderModule tests passed');
