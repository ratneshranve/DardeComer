import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const windowMs = config.rateLimitWindowMinutes * 60 * 1000;

const pollPaths = new Set([
    '/v1/food/orders',
    '/v1/food/restaurant/orders',
    '/v1/food/delivery/orders/available',
    '/v1/food/delivery/orders/current'
]);

const isPollRequest = (req) => {
    if (!req || req.method !== 'GET') return false;
    return pollPaths.has(req.path);
};

export const apiRateLimiter = rateLimit({
    windowMs,
    // Dev UX: local UI can generate lots of background API calls (location, polling, etc).
    // Keep production strict, but avoid blocking local development.
    max: config.nodeEnv === 'development' ? Math.max(config.rateLimitMaxRequests, 2000) : config.rateLimitMaxRequests,
    skip: (req) => isPollRequest(req),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

// Higher per-minute limit for known polling endpoints (still rate-limited, but not blocked by global limiter).
export const pollRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: config.nodeEnv === 'development' ? Math.max(config.rateLimitMaxRequests, 2000) : Math.max(config.rateLimitMaxRequests, 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please slow down.'
    }
});

const authWindowMs = config.authRateLimitWindowMinutes * 60 * 1000;

/** Stricter rate limit for auth routes (OTP, login, refresh, logout). Applied in addition to global limiter. */
export const authRateLimiter = rateLimit({
    windowMs: authWindowMs,
    // Dev UX: login/otp testing can be frequent. Keep production strict (e.g. 30), 
    // but relax local development to avoid 429 when testing flows.
    max: config.nodeEnv === 'development' ? Math.max(config.authRateLimitMax, 100) : config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    }
});

