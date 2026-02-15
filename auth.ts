import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { authConfig } from '@/auth.config';

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data;

                    const result = await db.query(
                        'SELECT * FROM users WHERE email = $1',
                        [email.toLowerCase()]
                    );

                    const user = result.rows[0];

                    if (!user || !user.password_hash) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password_hash);

                    if (passwordsMatch) {
                        // Check if email is verified
                        if (!user.email_verified) {
                            // Standard way to handle failed auth is returning null
                            // With NextAuth v5, throwing an error CAN work for custom messages
                            // but returning null is safer for generic unauthorized
                            // However, client-side is configured to show "Email not verified"
                            // Only way to do that is throwing specific error message
                            throw new Error('Email not verified');
                        }
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                        };
                    }
                }

                return null;
            },
        }),
    ],
});
