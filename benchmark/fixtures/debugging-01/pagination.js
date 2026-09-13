function paginate(items, pageSize, pageNumber) {
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize - 1; // BUG: inclusive upper bound drops/omits boundary items
  return items.slice(start, end);
}

module.exports = { paginate };
