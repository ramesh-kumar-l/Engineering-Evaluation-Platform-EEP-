function isValidEmail(value) {
  // Subtly inconsistent with userModule.js: does not trim whitespace first.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^\d{10}$/.test(String(value).replace(/[\s()-]/g, ''));
}

function isValidPostalCode(value) {
  // Subtly inconsistent with userModule.js: also accepts the ZIP+4 form.
  return /^\d{5}(-\d{4})?$/.test(String(value).trim());
}

module.exports = { isValidEmail, isValidPhone, isValidPostalCode };
