// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - SECURITY MODULE
// Export all security utilities
// ═══════════════════════════════════════════════════════════════════════════════

// Sanitization & Validation
export {
  sanitizeHtml,
  escapeHtml,
  sanitizeInput,
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  idSchema,
  uuidSchema,
  urlSchema,
  detectSqlInjection,
  sanitizeForSql,
  sanitizeFilePath,
  validateFileExtension,
  sanitizeForShell,
  generateCsrfToken,
  storeCsrfToken,
  getCsrfToken,
  validateCsrfToken,
  logSecurityEvent,
  isPasswordBreached,
  SecurityError,
  SecurityUtils,
} from './sanitization';

// Rate Limiting
export {
  RateLimiter,
  RATE_LIMITS,
  loginRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  formSubmitRateLimiter,
  sensitiveOpRateLimiter,
  useRateLimit,
} from './rateLimiter';

// Session Management
export {
  SessionManager,
  sessionManager,
  DEFAULT_CONFIG,
  useSecureSession,
} from './sessionManager';

// Re-export types
export type {
  RateLimitConfig,
  RateLimitEntry,
  RateLimitResult,
} from './rateLimiter';

export type {
  SessionConfig,
  SessionData,
  SessionStatus,
} from './sessionManager';
