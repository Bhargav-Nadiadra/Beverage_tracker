import crypto from 'crypto';

/**
 * Generate a secure random token for email verification
 * @param length - Length of the token (default: 32 bytes = 64 hex characters)
 * @returns Hexadecimal string token
 */
export function generateVerificationToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Get expiry date for verification token (24 hours from now)
 * @returns Date object representing token expiry
 */
export function getVerificationTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry;
}

/**
 * Check if a token has expired
 * @param expiryDate - Token expiry date
 * @returns True if token has expired, false otherwise
 */
export function isTokenExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return true;
    return new Date() > expiryDate;
}
