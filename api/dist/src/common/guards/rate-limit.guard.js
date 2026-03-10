"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
let LoginRateLimitGuard = class LoginRateLimitGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip ||
            request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            'unknown';
        const now = Date.now();
        const entry = loginAttempts.get(ip);
        if (entry) {
            if (now > entry.resetAt) {
                loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
                return true;
            }
            if (entry.count >= MAX_ATTEMPTS) {
                const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
                throw new common_1.HttpException(`Demasiados intentos. Intenta de nuevo en ${retryAfterSec} segundos.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            entry.count++;
        }
        else {
            loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        }
        return true;
    }
};
exports.LoginRateLimitGuard = LoginRateLimitGuard;
exports.LoginRateLimitGuard = LoginRateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], LoginRateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map