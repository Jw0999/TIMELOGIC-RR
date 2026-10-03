/**
 * TimeLogic Password Policy
 * ─────────────────────────────────────────────────────────────
 * Admin / SuperAdmin:
 *  - Minimum 8 characters
 *  - At least 1 lowercase letter
 *  - At least 1 uppercase letter
 *  - At least 1 numeric digit
 *  - At least 1 special character (!@#$%^&* etc.)
 *
 * Employee / Kiosk:
 *  - Can use ANY type of password (numbers only, letters only, PIN, simple strings)
 *  - Minimum 1 character
 */

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

function validateStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Admin password is required.',
    };
  }
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Admin password must be at least 8 characters long.',
    };
  }
  const missing = [];
  if (!/[a-z]/.test(password)) missing.push('lowercase letter (a-z)');
  if (!/[A-Z]/.test(password)) missing.push('uppercase letter (A-Z)');
  if (!/\d/.test(password)) missing.push('number (0-9)');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) missing.push('special character (!@#$%^&* etc.)');

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Admin password requires: ${missing.join(', ')}.`,
    };
  }
  return { valid: true };
}

function validateEmployeePassword(password) {
  if (!password || typeof password !== 'string' || password.length === 0) {
    return {
      valid: false,
      message: 'Employee password is required.',
    };
  }
  // Employees are permitted to use ANY type of password (including only numbers, e.g. 1234)
  return { valid: true };
}

module.exports = { validateStrongPassword, validateEmployeePassword, STRONG_PASSWORD_REGEX };
