/**
 * TimeLogic Strong Password Policy
 * ─────────────────────────────────────────────────────────────
 * Requires:
 *  - Minimum 8 characters
 *  - At least 1 lowercase letter
 *  - At least 1 uppercase letter
 *  - At least 1 numeric digit
 *  - At least 1 special character (!@#$%^&* etc.)
 */

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

function validateStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Password is required.',
    };
  }
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one lowercase letter (a-z).',
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one uppercase letter (A-Z).',
    };
  }
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one number (0-9).',
    };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one special character (!@#$%^&* etc.).',
    };
  }
  return { valid: true };
}

module.exports = { validateStrongPassword, STRONG_PASSWORD_REGEX };
