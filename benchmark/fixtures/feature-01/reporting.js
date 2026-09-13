/**
 * The on-screen report already has `columns` (ordered {key, header} pairs) and `rows` (plain
 * objects keyed by column key). exportToCsv does not exist yet — see
 * benchmark/tasks/feature-01.json for the required behavior.
 */
function exportToCsv(rows, columns) {
  throw new Error('exportToCsv is not implemented yet');
}

module.exports = { exportToCsv };
