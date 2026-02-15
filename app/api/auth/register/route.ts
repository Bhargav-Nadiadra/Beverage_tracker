import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signUpSchema } from '@/lib/validations';
import { sendVerificationEmail } from '@/lib/email';
import { generateVerificationToken, getVerificationTokenExpiry } from '@/lib/tokens';

/**
 * POST /api/auth/register
 * Register a new user with email and password
 * 
 * Request Body:
 * - email: string (required, valid email format)
 * - password: string (required, min 8 chars, 1 number, 1 special char)
 * - name: string (required)
 * 
 * Response:
 * - 201: User created successfully, verification email sent
 * - 400: Validation error
 * - 409: Email already exists
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validationResult = signUpSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { email, password, name } = validationResult.data;

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password with bcrypt (12 rounds for security)
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiry();

        // Create user in database
        const result = await db.query(
            `INSERT INTO users (
        email, 
        password_hash, 
        name, 
        verification_token, 
        verification_token_expiry, 
        email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, email_verified, created_at`,
            [
                email.toLowerCase(),
                passwordHash,
                name,
                verificationToken,
                verificationTokenExpiry,
                false
            ]
        );

        const user = result.rows[0];

        // Send verification email
        const emailResult = await sendVerificationEmail({
            email: user.email,
            name: user.name,
            verificationToken,
        });

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Note: We still return success because user was created
            // The user can request a new verification email later
        }

        return NextResponse.json(
            {
                message: 'Account created successfully. Please check your email to verify your account.',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    emailVerified: user.emailVerified,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration. Please try again.' },
            { status: 500 }
        );
    }
}
