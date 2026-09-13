const assert = require('node:assert');
const { exportToCsv } = require('./reporting');

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'note', header: 'Note' },
];

// Header row must match the provided column definitions, in order.
const headerOnly = exportToCsv([], columns);
assert.strictEqual(headerOnly.trim(), 'Name,Note');

// Commas, quotes, and newlines must be quoted/escaped per RFC 4180.
const special = exportToCsv([{ name: 'Ada, Lovelace', note: 'Said "hi"\nagain' }], columns);
assert.ok(special.includes('"Ada, Lovelace"'));
assert.ok(special.includes('"Said ""hi""\nagain"'));

// Empty/null fields render as empty CSV fields, not the string "null"/"undefined".
const nullable = exportToCsv([{ name: 'Grace', note: null }], columns);
assert.ok(!nullable.includes('null'));
assert.ok(!nullable.includes('undefined'));

console.log('reporting CSV export tests passed');
