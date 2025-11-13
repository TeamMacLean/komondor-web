/**
 * Application constants
 * @module utils/constants
 */

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  LOGIN: "/login",
  LOGOUT: "/logout",
  ME: "/me",
  USERS: "/users",
  GROUPS: "/groups",
  PROJECTS: "/projects",
  SAMPLES: "/samples",
  RUNS: "/runs",
  NEWS: "/news",
  OPTIONS: {
    LIBRARY_TYPE: "/options/librarytype",
    SEQUENCING_TECHNOLOGY: "/options/sequencingtechnology",
    LIBRARY_SOURCE: "/options/librarysource",
    LIBRARY_SELECTION: "/options/libraryselection",
    LIBRARY_STRATEGY: "/options/librarystrategy",
  },
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  MD5_WARNING: 'has_seen_md5_warning',
  PREFERENCES: 'user_preferences',
}

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5 MB
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
  SEQUENCE: 100 * 1024 * 1024, // 100 MB
  LARGE_FILE: 1024 * 1024 * 1024, // 1 GB
};

/**
 * Allowed file extensions
 */
export const FILE_EXTENSIONS = {
  IMAGES: ["jpg", "jpeg", "png", "gif", "bmp", "svg"],
  DOCUMENTS: ["pdf", "doc", "docx", "txt", "csv", "xls", "xlsx"],
  SEQUENCE_DATA: ["fastq", "fq", "fasta", "fa", "bam", "sam", "vcf"],
  COMPRESSED: ["zip", "gz", "tar", "bz2", "7z"],
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  SHORT: "YYYY-MM-DD",
  LONG: "MMMM D, YYYY",
  WITH_TIME: "YYYY-MM-DD HH:mm:ss",
  TIME_ONLY: "HH:mm",
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 1000,
};

/**
 * Validation rules
 */
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PROJECT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  SAMPLE_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
};

/**
 * Toast notification durations (milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
};

/**
 * Debounce delays (milliseconds)
 */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
  RESIZE: 150,
  SCROLL: 100,
};

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
};

/**
 * Entity types
 */
export const ENTITY_TYPES = {
  PROJECT: "project",
  SAMPLE: "sample",
  RUN: "run",
  USER: "user",
  GROUP: "group",
};

/**
 * Sort orders
 */
export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
};

/**
 * Loading states
 */
export const LOADING_STATE = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * Modal sizes (Buefy)
 */
export const MODAL_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  FULL: "full",
};

/**
 * Color palette
 */
export const COLORS = {
  PRIMARY: "#3C3F41",
  SUCCESS: "#48c774",
  WARNING: "#ffdd57",
  DANGER: "#f14668",
  INFO: "#3298dc",
  LIGHT: "#f5f5f5",
  DARK: "#363636",
};

/**
 * Breakpoints (matching Bulma)
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 769,
  DESKTOP: 1024,
  WIDESCREEN: 1216,
  FULLHD: 1408,
};

/**
 * Regular expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  IPV4: /^(\d{1,3}\.){3}\d{1,3}$/,
  SEMANTIC_VERSION: /^\d+\.\d+\.\d+$/,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_URL: "Please enter a valid URL",
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_MISMATCH: "Passwords do not match",
  USERNAME_TAKEN: "This username is already taken",
  EMAIL_TAKEN: "This email is already registered",
  INVALID_CREDENTIALS: "Invalid username or password",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "The requested resource was not found",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your connection.",
  FILE_TOO_LARGE: (max) => `File size must not exceed ${max}`,
  INVALID_FILE_TYPE: (types) => `Only ${types.join(", ")} files are allowed`,
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SAVED: "Saved successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  UPLOADED: "Uploaded successfully",
  LOGIN: "Welcome back!",
  LOGOUT: "Logged out successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  EMAIL_SENT: "Email sent successfully",
  COPIED: "Copied to clipboard",
};

/**
 * Info messages
 */
export const INFO_MESSAGES = {
  NO_RESULTS: "No results found",
  LOADING: "Loading...",
  SEARCHING: "Searching...",
  PROCESSING: "Processing...",
  UPLOADING: "Uploading...",
  SAVING: "Saving...",
  EMPTY_LIST: "No items to display",
};

/**
 * Confirmation messages
 */
export const CONFIRM_MESSAGES = {
  DELETE: "Are you sure you want to delete this item?",
  DELETE_MULTIPLE: (count) => `Are you sure you want to delete ${count} items?`,
  LOGOUT: "Are you sure you want to logout?",
  DISCARD_CHANGES: "Are you sure you want to discard your changes?",
  CANCEL: "Are you sure you want to cancel?",
  REMOVE: "Are you sure you want to remove this item?",
};

/**
 * Application metadata
 */
export const APP_META = {
  NAME: "TSL Sequence Store",
  SHORT_NAME: "SequenceStore",
  DESCRIPTION: "TSL Sequence Data",
  VERSION: "1.0.0",
  AUTHOR: "George Deeks",
};

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  DOCUMENTATION: "/docs",
  SUPPORT: "/help",
  GITHUB: "https://github.com/yourusername/komondor",
  PRIVACY_POLICY: "/privacy",
  TERMS_OF_SERVICE: "/terms",
};

/**
 * Feature flags
 */
export const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: false,
  ENABLE_EXPERIMENTAL: false,
};

/**
 * Animation durations (milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

/**
 * Z-index layers
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
};

export default {
  API_ENDPOINTS,
  HTTP_STATUS,
  STORAGE_KEYS,
  FILE_SIZE_LIMITS,
  FILE_EXTENSIONS,
  DATE_FORMATS,
  PAGINATION,
  VALIDATION,
  TOAST_DURATION,
  DEBOUNCE_DELAY,
  USER_ROLES,
  ENTITY_TYPES,
  SORT_ORDER,
  LOADING_STATE,
  MODAL_SIZES,
  COLORS,
  BREAKPOINTS,
  REGEX,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  CONFIRM_MESSAGES,
  APP_META,
  EXTERNAL_LINKS,
  FEATURES,
  ANIMATION_DURATION,
  Z_INDEX,
};
