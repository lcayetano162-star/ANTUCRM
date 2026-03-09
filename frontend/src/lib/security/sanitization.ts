// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - INPUT SANITIZATION & VALIDATION
// Security utilities for preventing XSS, injection, and other attacks
// ═══════════════════════════════════════════════════════════════════════════════

import DOMPurify from 'dompurify';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// XSS PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify to remove dangerous HTML
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return escaped string
    return escapeHtml(dirty);
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
  });
}

/**
 * Escape HTML entities to prevent XSS
 * Use this for plain text that should never contain HTML
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize user input for display
 * Removes all HTML tags and escapes special characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Trim and limit length
  return withoutTags.trim().slice(0, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(5, 'Email debe tener al menos 5 caracteres')
  .max(254, 'Email no puede exceder 254 caracteres')
  .email('Email inválido')
  .regex(/^[^<>\"]*$/, 'Email contiene caracteres inválidos');

/**
 * Password validation schema
 * Enforces strong password requirements
 */
export const passwordSchema = z
  .string()
  .min(12, 'Contraseña debe tener al menos 12 caracteres')
  .max(128, 'Contraseña no puede exceder 128 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
  .regex(/^[^<>\"]*$/, 'Contraseña contiene caracteres inválidos');

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Nombre debe tener al menos 2 caracteres')
  .max(100, 'Nombre no puede exceder 100 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'Nombre contiene caracteres inválidos');

/**
 * Phone validation schema
 */
export const phoneSchema = z
  .string()
  .min(10, 'Teléfono debe tener al menos 10 dígitos')
  .max(20, 'Teléfono no puede exceder 20 dígitos')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono contiene caracteres inválidos');

/**
 * ID validation schema (RNC, cédula)
 */
export const idSchema = z
  .string()
  .min(9, 'ID debe tener al menos 9 caracteres')
  .max(20, 'ID no puede exceder 20 caracteres')
  .regex(/^[\d\-]+$/, 'ID debe contener solo números y guiones');

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'UUID inválido');

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('URL inválida')
  .regex(/^https?:\/\//, 'URL debe comenzar con http:// o https://')
  .max(2048, 'URL demasiado larga');

// ═══════════════════════════════════════════════════════════════════════════════
// SQL INJECTION PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SQL injection detection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /UNION\s+SELECT/i,
  /INSERT\s+INTO/i,
  /DELETE\s+FROM/i,
  /DROP\s+TABLE/i,
  /ALTER\s+TABLE/i,
];

/**
 * Check if input contains potential SQL injection
 */
export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize input for database queries
 * Note: Always use parameterized queries (ORM) instead of string concatenation
 */
export function sanitizeForSql(input: string): string {
  if (detectSqlInjection(input)) {
    throw new SecurityError('Potential SQL injection detected');
  }
  return input.replace(/['";\\]/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH TRAVERSAL PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize file path to prevent path traversal attacks
 */
export function sanitizeFilePath(filePath: string): string {
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');
  
  // Remove path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove leading slashes (prevent absolute paths)
  sanitized = sanitized.replace(/^[\/\\]+/, '');
  
  // Only allow alphanumeric, dots, dashes, and single slashes
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\-\/]/g, '');
  
  return sanitized;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND INJECTION PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

const DANGEROUS_CHARS = /[;&|`$(){}[\]\\\n\r]/;

/**
 * Sanitize input for shell commands
 * WARNING: Avoid shell execution with user input whenever possible
 */
export function sanitizeForShell(input: string): string {
  if (DANGEROUS_CHARS.test(input)) {
    throw new SecurityError('Input contains dangerous characters for shell execution');
  }
  return input;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in sessionStorage
 */
export function storeCsrfToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch {
    // sessionStorage not available
  }
}

/**
 * Get stored CSRF token
 */
export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch {
    return null;
  }
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  const stored = getCsrfToken();
  return stored !== null && stored === token;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
    
    // Log security event (in production, send to SIEM)
    logSecurityEvent('SECURITY_VIOLATION', { message });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY EVENT LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

interface SecurityEvent {
  type: string;
  timestamp: string;
  details: Record<string, unknown>;
  userAgent: string;
  url: string;
}

/**
 * Log security events
 * In production, this should send to a backend SIEM
 */
export function logSecurityEvent(type: string, details: Record<string, unknown>): void {
  const event: SecurityEvent = {
    type,
    timestamp: new Date().toISOString(),
    details,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
  
  // Log to console in development
  // @ts-ignore - Vite uses import.meta.env
  if (import.meta.env?.DEV) {
    console.warn('[SECURITY EVENT]', event);
  }
  
  // TODO: Send to backend security endpoint
  // fetch('/api/security/log', { method: 'POST', body: JSON.stringify(event) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BREACHED PASSWORD CHECK
// ═══════════════════════════════════════════════════════════════════════════════

// Common breached passwords (simplified list - use HaveIBeenPwned API in production)
const BREACHED_PASSWORDS = new Set([
  'password', 'password123', 'password1', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome', 'welcome123',
  'admin', 'admin123', 'root', 'toor', 'pass', 'pass123', 'login',
  'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football',
  'baseball', 'iloveyou', 'trustno1', 'shadow', 'ashley', 'michael',
  'jesus', 'mustang', 'access', 'love', 'pussy', '696969', 'qwertyuiop',
  'password12', 'password1234', 'password12345', 'password123456',
  '1234567890', '1234567', '123123', '987654321', 'qwe123', 'qweasd',
  'superman', 'batman', 'harley', 'hunter', 'ranger', 'thomas',
  'robert', 'michael', 'jordan', 'maggie', 'buster', 'daniel',
  'andrew', 'joshua', 'pepper', 'ginger', 'tigger', 'matthew',
  'amanda', 'summer', 'phoenix', 'martin', 'cheese', 'taylor',
  'internet', 'blessed', 'purple', 'silver', 'orange', 'flower',
  'antucrm', 'antu2026', 'antu2026!', 'crm2026', 'demo2026',
]);

/**
 * Check if password is in breached database
 * In production, use k-anonymity API of HaveIBeenPwned
 */
export function isPasswordBreached(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Direct match
  if (BREACHED_PASSWORDS.has(lowerPassword)) {
    return true;
  }
  
  // Check for common patterns
  if (BREACHED_PASSWORDS.has(lowerPassword.replace(/[^a-z]/g, ''))) {
    return true;
  }
  
  // Check for reversed
  if (BREACHED_PASSWORDS.has(lowerPassword.split('').reverse().join(''))) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export const SecurityUtils = {
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
};

export default SecurityUtils;
