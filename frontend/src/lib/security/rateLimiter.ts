// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - RATE LIMITER
// Client-side rate limiting for authentication and sensitive operations
// ═══════════════════════════════════════════════════════════════════════════════

import { logSecurityEvent } from './sanitization';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  cooldownEnd: number | null;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  cooldownEnd: number | null;
  waitSeconds: number;
  message: string;
}

// Default configurations for different operations
export const RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes, 30 min cooldown
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    cooldownMs: 30 * 60 * 1000, // 30 minutes
  },
  
  // Password reset: 3 attempts per 15 minutes
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
    cooldownMs: 15 * 60 * 1000,
  },
  
  // API calls: 100 per minute
  API: {
    maxAttempts: 100,
    windowMs: 60 * 1000,
    cooldownMs: 60 * 1000,
  },
  
  // Form submissions: 10 per minute
  FORM_SUBMIT: {
    maxAttempts: 10,
    windowMs: 60 * 1000,
    cooldownMs: 60 * 1000,
  },
  
  // Sensitive operations: 3 per 5 minutes
  SENSITIVE: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,
    cooldownMs: 10 * 60 * 1000,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private storageKey: string;

  constructor(config: RateLimitConfig, storageKey: string) {
    this.config = config;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  /**
   * Load rate limit data from sessionStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.storage = new Map(Object.entries(data));
      }
    } catch {
      // sessionStorage not available or corrupted
      this.storage = new Map();
    }
  }

  /**
   * Save rate limit data to sessionStorage
   */
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.storage);
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // sessionStorage not available
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      // Remove entries where cooldown has expired and window has passed
      if (entry.cooldownEnd && now > entry.cooldownEnd) {
        if (now > entry.firstAttempt + this.config.windowMs) {
          this.storage.delete(key);
        }
      }
    }
    this.saveToStorage();
  }

  /**
   * Check if operation is allowed
   */
  check(key: string): RateLimitResult {
    this.cleanup();
    
    const now = Date.now();
    const entry = this.storage.get(key);

    // No previous attempts
    if (!entry) {
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
        cooldownEnd: null,
        waitSeconds: 0,
        message: '',
      };
    }

    // Check if in cooldown
    if (entry.cooldownEnd && now < entry.cooldownEnd) {
      const waitSeconds = Math.ceil((entry.cooldownEnd - now) / 1000);
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { key, waitSeconds });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownEnd: entry.cooldownEnd,
        waitSeconds,
        message: `Demasiados intentos. Por favor espera ${this.formatWaitTime(waitSeconds)}.`,
      };
    }

    // Check if window has expired (reset counter)
    if (now > entry.firstAttempt + this.config.windowMs) {
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1,
        cooldownEnd: null,
        waitSeconds: 0,
        message: '',
      };
    }

    // Check if max attempts reached
    if (entry.attempts >= this.config.maxAttempts) {
      const cooldownEnd = now + this.config.cooldownMs;
      entry.cooldownEnd = cooldownEnd;
      this.storage.set(key, entry);
      this.saveToStorage();
      
      const waitSeconds = Math.ceil(this.config.cooldownMs / 1000);
      logSecurityEvent('RATE_LIMIT_COOLDOWN_STARTED', { key, waitSeconds });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownEnd,
        waitSeconds,
        message: `Demasiados intentos. Por favor espera ${this.formatWaitTime(waitSeconds)}.`,
      };
    }

    // Allow but decrement remaining
    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - entry.attempts - 1,
      cooldownEnd: null,
      waitSeconds: 0,
      message: '',
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(key: string, success: boolean = false): void {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      this.storage.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        cooldownEnd: null,
      });
    } else {
      // Reset if window has expired
      if (now > entry.firstAttempt + this.config.windowMs) {
        this.storage.set(key, {
          attempts: 1,
          firstAttempt: now,
          lastAttempt: now,
          cooldownEnd: null,
        });
      } else {
        entry.attempts += 1;
        entry.lastAttempt = now;
        
        // Start cooldown if max attempts reached
        if (entry.attempts >= this.config.maxAttempts) {
          entry.cooldownEnd = now + this.config.cooldownMs;
          logSecurityEvent('RATE_LIMIT_MAX_ATTEMPTS', { key, attempts: entry.attempts });
        }
        
        this.storage.set(key, entry);
      }
    }

    this.saveToStorage();

    // Log failed attempts
    if (!success) {
      logSecurityEvent('AUTH_ATTEMPT_FAILED', { key, attempts: this.storage.get(key)?.attempts });
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.storage.delete(key);
    this.saveToStorage();
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.storage.clear();
    this.saveToStorage();
  }

  /**
   * Format wait time for display
   */
  private formatWaitTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes} minutos y ${remainingSeconds} segundos`
        : `${minutes} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} horas y ${remainingMinutes} minutos`
      : `${hours} horas`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER INSTANCES
// ═══════════════════════════════════════════════════════════════════════════════

export const loginRateLimiter = new RateLimiter(RATE_LIMITS.LOGIN, 'antu_rate_limit_login');
export const passwordResetRateLimiter = new RateLimiter(RATE_LIMITS.PASSWORD_RESET, 'antu_rate_limit_reset');
export const apiRateLimiter = new RateLimiter(RATE_LIMITS.API, 'antu_rate_limit_api');
export const formSubmitRateLimiter = new RateLimiter(RATE_LIMITS.FORM_SUBMIT, 'antu_rate_limit_form');
export const sensitiveOpRateLimiter = new RateLimiter(RATE_LIMITS.SENSITIVE, 'antu_rate_limit_sensitive');

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR REACT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

interface UseRateLimitReturn {
  isLimited: boolean;
  remainingAttempts: number;
  waitSeconds: number;
  message: string;
  checkLimit: () => boolean;
  recordAttempt: (success?: boolean) => void;
}

export function useRateLimit(
  key: string,
  limiter: RateLimiter = loginRateLimiter
): UseRateLimitReturn {
  const [state, setState] = useState<RateLimitResult>({
    allowed: true,
    remainingAttempts: 5,
    cooldownEnd: null,
    waitSeconds: 0,
    message: '',
  });

  const checkLimit = useCallback((): boolean => {
    const result = limiter.check(key);
    setState(result);
    return result.allowed;
  }, [key, limiter]);

  const recordAttempt = useCallback((success: boolean = false) => {
    limiter.recordAttempt(key, success);
    const result = limiter.check(key);
    setState(result);
  }, [key, limiter]);

  return {
    isLimited: !state.allowed,
    remainingAttempts: state.remainingAttempts,
    waitSeconds: state.waitSeconds,
    message: state.message,
    checkLimit,
    recordAttempt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export { RateLimiter };
export type { RateLimitConfig, RateLimitEntry, RateLimitResult };

export default {
  loginRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  formSubmitRateLimiter,
  sensitiveOpRateLimiter,
  useRateLimit,
};
