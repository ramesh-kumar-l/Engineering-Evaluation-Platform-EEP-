function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isValidPhone(value) {
  // Subtly inconsistent with userModule.js: strips all non-digits, not just separators.
  return /^\d{10}$/.test(String(value).replace(/\D/g, ''));
}

function isValidPostalCode(value) {
  return /^\d{5}$/.test(String(value).trim());
}

module.exports = { isValidEmail, isValidPhone, isValidPostalCode };
