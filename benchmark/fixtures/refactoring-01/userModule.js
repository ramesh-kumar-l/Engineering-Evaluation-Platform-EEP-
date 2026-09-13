function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isValidPhone(value) {
  return /^\d{10}$/.test(String(value).replace(/[\s()-]/g, ''));
}

function isValidPostalCode(value) {
  return /^\d{5}$/.test(String(value).trim());
}

module.exports = { isValidEmail, isValidPhone, isValidPostalCode };
