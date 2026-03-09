// ═══════════════════════════════════════════════════════════════════════════════
// ANTÜ CRM - SECURE SESSION MANAGER
// Enhanced session management with security hardening
// ═══════════════════════════════════════════════════════════════════════════════

import { logSecurityEvent } from './sanitization';
import { loginRateLimiter } from './rateLimiter';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface SessionConfig {
  inactivityTimeout: number; // ms
  maxSessionDuration: number; // ms
  warningBeforeExpiry: number; // ms
}

interface SessionData {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  permissions: string[];
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  deviceFingerprint: string;
}

interface SessionStatus {
  isValid: boolean;
  expiresIn: number;
  warningShown: boolean;
}

// Session configuration
const DEFAULT_CONFIG: SessionConfig = {
  inactivityTimeout: 15 * 60 * 1000, // 15 minutes
  maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
  warningBeforeExpiry: 5 * 60 * 1000, // 5 minutes warning
};

// Storage keys
const STORAGE_KEY = 'antu_secure_session';
const SESSION_ID_KEY = 'antu_session_id';

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE FINGERPRINTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate device fingerprint for session binding
 * This helps detect session hijacking
 */
function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.hardwareConcurrency,
  ];
  
  const fingerprint = components.join('::');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * Get current device fingerprint
 */
function getCurrentFingerprint(): string {
  return generateDeviceFingerprint();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class SessionManager {
  private config: SessionConfig;
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private onExpireCallback: (() => void) | null = null;
  private onWarningCallback: (() => void) | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupActivityListeners();
  }

  /**
   * Generate cryptographically secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Setup activity listeners for inactivity detection
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, () => this.recordActivity(), { passive: true });
    });
  }

  /**
   * Save session to secure storage (sessionStorage)
   */
  private saveSession(session: SessionData): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      sessionStorage.setItem(SESSION_ID_KEY, session.sessionId);
    } catch (error) {
      logSecurityEvent('SESSION_STORAGE_ERROR', { error: String(error) });
    }
  }

  /**
   * Load session from storage
   */
  private loadSession(): SessionData | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SessionData;
      }
    } catch (error) {
      logSecurityEvent('SESSION_LOAD_ERROR', { error: String(error) });
    }
    return null;
  }

  /**
   * Clear session from storage
   */
  private clearSession(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_ID_KEY);
    } catch (error) {
      logSecurityEvent('SESSION_CLEAR_ERROR', { error: String(error) });
    }
  }

  /**
   * Create new session
   */
  createSession(userData: Omit<SessionData, 'sessionId' | 'createdAt' | 'lastActivity' | 'expiresAt' | 'deviceFingerprint'>): SessionData {
    const now = Date.now();
    const session: SessionData = {
      ...userData,
      sessionId: this.generateSessionId(),
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.maxSessionDuration,
      deviceFingerprint: getCurrentFingerprint(),
    };

    this.saveSession(session);
    this.setupTimers(session);
    
    logSecurityEvent('SESSION_CREATED', { 
      userId: session.userId, 
      sessionId: session.sessionId.substring(0, 8) + '...' 
    });

    return session;
  }

  /**
   * Validate current session
   */
  validateSession(): SessionStatus {
    const session = this.loadSession();
    
    if (!session) {
      return { isValid: false, expiresIn: 0, warningShown: false };
    }

    const now = Date.now();

    // Check if session has expired
    if (now > session.expiresAt) {
      this.destroySession('EXPIRED');
      return { isValid: false, expiresIn: 0, warningShown: false };
    }

    // Check inactivity timeout
    if (now > session.lastActivity + this.config.inactivityTimeout) {
      this.destroySession('INACTIVITY');
      return { isValid: false, expiresIn: 0, warningShown: false };
    }

    // Check device fingerprint (session hijacking detection)
    const currentFingerprint = getCurrentFingerprint();
    if (currentFingerprint !== session.deviceFingerprint) {
      logSecurityEvent('SESSION_FINGERPRINT_MISMATCH', {
        userId: session.userId,
        expected: session.deviceFingerprint.substring(0, 8),
        actual: currentFingerprint.substring(0, 8),
      });
      this.destroySession('FINGERPRINT_MISMATCH');
      return { isValid: false, expiresIn: 0, warningShown: false };
    }

    const expiresIn = session.expiresAt - now;
    const warningShown = expiresIn < this.config.warningBeforeExpiry;

    return { isValid: true, expiresIn, warningShown };
  }

  /**
   * Record user activity
   */
  recordActivity(): void {
    const session = this.loadSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }

  /**
   * Setup session timers
   */
  private setupTimers(session: SessionData): void {
    this.clearTimers();

    const now = Date.now();
    
    // Warning timer
    const warningTime = session.expiresAt - now - this.config.warningBeforeExpiry;
    if (warningTime > 0 && this.onWarningCallback) {
      this.warningTimer = setTimeout(() => {
        this.onWarningCallback?.();
      }, warningTime);
    }

    // Expiry timer
    const expiryTime = session.expiresAt - now;
    if (expiryTime > 0 && this.onExpireCallback) {
      this.expiryTimer = setTimeout(() => {
        this.destroySession('EXPIRED');
        this.onExpireCallback?.();
      }, expiryTime);
    }

    // Inactivity timer
    this.inactivityTimer = setInterval(() => {
      const currentSession = this.loadSession();
      if (currentSession) {
        const inactive = Date.now() - currentSession.lastActivity;
        if (inactive > this.config.inactivityTimeout) {
          this.destroySession('INACTIVITY');
          this.onExpireCallback?.();
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Destroy session
   */
  destroySession(reason: string = 'LOGOUT'): void {
    const session = this.loadSession();
    
    if (session) {
      logSecurityEvent('SESSION_DESTROYED', {
        userId: session.userId,
        reason,
        sessionId: session.sessionId.substring(0, 8) + '...',
      });
    }

    this.clearTimers();
    this.clearSession();
    loginRateLimiter.resetAll();
  }

  /**
   * Extend session (renew)
   */
  extendSession(): boolean {
    const session = this.loadSession();
    if (!session) return false;

    const validation = this.validateSession();
    if (!validation.isValid) return false;

    // Extend session duration
    session.expiresAt = Date.now() + this.config.maxSessionDuration;
    session.lastActivity = Date.now();
    
    this.saveSession(session);
    this.setupTimers(session);

    logSecurityEvent('SESSION_EXTENDED', {
      userId: session.userId,
      newExpiry: new Date(session.expiresAt).toISOString(),
    });

    return true;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    const validation = this.validateSession();
    if (!validation.isValid) return null;
    return this.loadSession();
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    try {
      return sessionStorage.getItem(SESSION_ID_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.validateSession().isValid;
  }

  /**
   * Set callback for session expiry
   */
  onExpire(callback: () => void): void {
    this.onExpireCallback = callback;
  }

  /**
   * Set callback for session warning
   */
  onWarning(callback: () => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Get time until expiry
   */
  getTimeUntilExpiry(): number {
    const session = this.loadSession();
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Get time until inactivity timeout
   */
  getTimeUntilInactivityTimeout(): number {
    const session = this.loadSession();
    if (!session) return 0;
    const inactive = Date.now() - session.lastActivity;
    return Math.max(0, this.config.inactivityTimeout - inactive);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const sessionManager = new SessionManager();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

interface UseSessionReturn {
  isAuthenticated: boolean;
  session: SessionData | null;
  timeUntilExpiry: number;
  timeUntilInactivity: number;
  extendSession: () => boolean;
  logout: (reason?: string) => void;
}

export function useSecureSession(): UseSessionReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
  const [timeUntilInactivity, setTimeUntilInactivity] = useState(0);

  const updateStatus = useCallback(() => {
    const auth = sessionManager.isAuthenticated();
    setIsAuthenticated(auth);
    setSession(sessionManager.getSession());
    setTimeUntilExpiry(sessionManager.getTimeUntilExpiry());
    setTimeUntilInactivity(sessionManager.getTimeUntilInactivityTimeout());
  }, []);

  useEffect(() => {
    updateStatus();

    // Update status every 10 seconds
    const interval = setInterval(updateStatus, 10000);

    // Setup expiry callback
    sessionManager.onExpire(() => {
      setIsAuthenticated(false);
      setSession(null);
      window.location.href = '/login?reason=session_expired';
    });

    return () => {
      clearInterval(interval);
    };
  }, [updateStatus]);

  const extendSession = useCallback(() => {
    const result = sessionManager.extendSession();
    if (result) {
      updateStatus();
    }
    return result;
  }, [updateStatus]);

  const logout = useCallback((reason: string = 'LOGOUT') => {
    sessionManager.destroySession(reason);
    setIsAuthenticated(false);
    setSession(null);
  }, []);

  return {
    isAuthenticated,
    session,
    timeUntilExpiry,
    timeUntilInactivity,
    extendSession,
    logout,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export { SessionManager, DEFAULT_CONFIG };
export type { SessionConfig, SessionData, SessionStatus };

export default sessionManager;
