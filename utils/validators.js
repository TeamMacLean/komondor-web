/**
 * Validation utility functions
 * @module utils/validators
 */

/**
 * Validate email format
 * @param {string} email - The email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate required field
 * @param {*} value - The value to check
 * @returns {boolean} True if value is not empty
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate minimum length
 * @param {string|Array} value - The value to check
 * @param {number} minLength - Minimum required length
 * @returns {boolean} True if value meets minimum length
 */
export const validateMinLength = (value, minLength) => {
  if (!value) return false;
  return value.length >= minLength;
};

/**
 * Validate maximum length
 * @param {string|Array} value - The value to check
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if value is within maximum length
 */
export const validateMaxLength = (value, maxLength) => {
  if (!value) return true; // Empty is valid for max length
  return value.length <= maxLength;
};

/**
 * Validate numeric value
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a valid number
 */
export const validateNumber = (value) => {
  if (value === null || value === undefined || value === "") return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate integer value
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a valid integer
 */
export const validateInteger = (value) => {
  return validateNumber(value) && Number.isInteger(Number(value));
};

/**
 * Validate positive number
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a positive number
 */
export const validatePositive = (value) => {
  return validateNumber(value) && Number(value) > 0;
};

/**
 * Validate number within range
 * @param {number} value - The value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if value is within range
 */
export const validateRange = (value, min, max) => {
  if (!validateNumber(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
};

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL format
 */
export const validateUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date format (ISO 8601)
 * @param {string} date - The date string to validate
 * @returns {boolean} True if valid date format
 */
export const validateDate = (date) => {
  if (!date) return false;
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
};

/**
 * Validate alphanumeric string (letters and numbers only)
 * @param {string} value - The value to check
 * @returns {boolean} True if only alphanumeric characters
 */
export const validateAlphanumeric = (value) => {
  if (!value) return false;
  const re = /^[a-zA-Z0-9]+$/;
  return re.test(value);
};

/**
 * Validate username format (alphanumeric, underscore, hyphen)
 * @param {string} username - The username to validate
 * @param {number} minLength - Minimum length (default: 3)
 * @param {number} maxLength - Maximum length (default: 20)
 * @returns {boolean} True if valid username format
 */
export const validateUsername = (username, minLength = 3, maxLength = 20) => {
  if (!username) return false;
  const re = /^[a-zA-Z0-9_-]+$/;
  return (
    re.test(username) &&
    username.length >= minLength &&
    username.length <= maxLength
  );
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @param {Object} requirements - Password requirements
 * @param {number} requirements.minLength - Minimum length (default: 8)
 * @param {boolean} requirements.requireUppercase - Require uppercase letter
 * @param {boolean} requirements.requireLowercase - Require lowercase letter
 * @param {boolean} requirements.requireNumber - Require number
 * @param {boolean} requirements.requireSpecial - Require special character
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password, requirements = {}) => {
  if (!password) return false;

  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = requirements;

  if (password.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumber && !/[0-9]/.test(password)) return false;
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
};

/**
 * Get the matching extension from a filename against a list of allowed extensions.
 * Prioritizes longer extensions (e.g., checks '.fastq.gz' before '.gz').
 * @param {string} filename - The full name of the file (e.g., "sample.fastq.gz")
 * @param {string[]} validExtensions - Array of extensions (e.g., ['.fastq.gz', '.gz'])
 * @returns {string|null} - The matched extension or null if no match found
 */
export const getMatchingExtension = (filename, validExtensions) => {
  if (!filename || !validExtensions || validExtensions.length === 0) {
    return null;
  }

  // Sort extensions by length descending to match longer extensions first
  // This ensures we match '.fastq.gz' before '.gz'
  const sortedExtensions = [...validExtensions].sort(
    (a, b) => b.length - a.length
  );

  // Normalize filename to lowercase for case-insensitive matching
  const lowerFilename = filename.toLowerCase();

  // Find the first extension that the filename ends with
  const match = sortedExtensions.find((ext) =>
    lowerFilename.endsWith(ext.toLowerCase())
  );

  return match || null;
};

/**
 * Validate file extension
 * @param {string} filename - The filename to check
 * @param {string[]} allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.png'] or ['jpg', 'png'])
 * @returns {boolean} True if file has allowed extension
 */
export const validateFileExtension = (filename, allowedExtensions) => {
  if (!filename || !allowedExtensions || allowedExtensions.length === 0) {
    return false;
  }

  // Normalize extensions to ensure they start with a dot
  const normalizedExtensions = allowedExtensions.map((ext) =>
    ext.startsWith(".") ? ext : `.${ext}`
  );

  return getMatchingExtension(filename, normalizedExtensions) !== null;
};

/**
 * Validate file size
 * @param {number} sizeInBytes - The file size in bytes
 * @param {number} maxSizeInMB - Maximum size in megabytes
 * @returns {boolean} True if file size is within limit
 */
export const validateFileSize = (sizeInBytes, maxSizeInMB) => {
  if (!validateNumber(sizeInBytes) || !validateNumber(maxSizeInMB)) {
    return false;
  }

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Validate JSON string
 * @param {string} jsonString - The JSON string to validate
 * @returns {boolean} True if valid JSON
 */
export const validateJson = (jsonString) => {
  if (!jsonString) return false;
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (basic format)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid phone format
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  // Basic international phone format: +XX XXXXXXXXXX or similar
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

/**
 * Validate hex color code
 * @param {string} color - The color code to validate
 * @returns {boolean} True if valid hex color
 */
export const validateHexColor = (color) => {
  if (!color) return false;
  const re = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return re.test(color);
};

/**
 * Composite validator - run multiple validators
 * @param {*} value - The value to validate
 * @param {Function[]} validators - Array of validator functions
 * @returns {Object} Validation result with { valid, errors }
 */
export const validate = (value, validators) => {
  const errors = [];

  for (const validator of validators) {
    if (typeof validator === "function") {
      const result = validator(value);
      if (!result) {
        errors.push(validator.name || "Validation failed");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Create custom validator with error message
 * @param {Function} validatorFn - The validator function
 * @param {string} errorMessage - The error message to return
 * @returns {Function} Wrapped validator function
 */
export const createValidator = (validatorFn, errorMessage) => {
  return (value) => {
    const isValid = validatorFn(value);
    return isValid ? true : errorMessage;
  };
};

export default {
  validateEmail,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateInteger,
  validatePositive,
  validateRange,
  validateUrl,
  validateDate,
  validateAlphanumeric,
  validateUsername,
  validatePassword,
  getMatchingExtension,
  validateFileExtension,
  validateFileSize,
  validateJson,
  validatePhone,
  validateHexColor,
  validate,
  createValidator,
};
