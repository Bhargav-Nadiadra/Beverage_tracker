import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyEmailSchema } from '@/lib/validations';
import { isTokenExpired } from '@/lib/tokens';

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify user's email address using verification token
 * 
 * Query Parameters:
 * - token: string (required, verification token from email)
 * 
 * Response:
 * - 200: Email verified successfully
 * - 400: Invalid or missing token
 * - 404: Token not found or already used
 * - 410: Token expired
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        // Validate token parameter
        const validationResult = verifyEmailSchema.safeParse({ token });

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid verification token',
                    details: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { token: verificationToken } = validationResult.data;

        // Find user with this verification token
        const result = await db.query(
            `SELECT id, email, name, email_verified, verification_token_expiry 
       FROM users 
       WHERE verification_token = $1`,
            [verificationToken]
        );

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid verification token or email already verified' },
                { status: 404 }
            );
        }

        // Check if email is already verified
        if (user.email_verified) {
            return NextResponse.json(
                { error: 'Email address is already verified' },
                { status: 400 }
            );
        }

        // Check if token has expired
        if (isTokenExpired(new Date(user.verification_token_expiry))) {
            return NextResponse.json(
                { error: 'Verification token has expired. Please request a new verification email.' },
                { status: 410 }
            );
        }

        // Update user: mark email as verified and clear verification token
        await db.query(
            `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expiry = NULL 
       WHERE id = $1`,
            [user.id]
        );

        return NextResponse.json(
            {
                message: 'Email verified successfully! You can now log in to your account.',
                user: {
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json(
            { error: 'An error occurred during email verification. Please try again.' },
            { status: 500 }
        );
    }
}
