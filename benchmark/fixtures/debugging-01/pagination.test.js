const assert = require('node:assert');
const { paginate } = require('./pagination');

const items = Array.from({ length: 10 }, (_, i) => i + 1);

// A full page must contain exactly pageSize items.
assert.deepStrictEqual(paginate(items, 3, 1), [1, 2, 3]);

// The final, partial page must include every remaining item, none omitted.
assert.deepStrictEqual(paginate(items, 3, 4), [10]);

// When totalItems is an exact multiple of pageSize, the last page must not drop its last item.
const exact = Array.from({ length: 9 }, (_, i) => i + 1);
assert.deepStrictEqual(paginate(exact, 3, 3), [7, 8, 9]);

console.log('pagination tests passed');
