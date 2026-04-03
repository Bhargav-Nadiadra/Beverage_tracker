import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
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
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
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
                        if (!user.email_verified) {
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
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                if (!user.email) return false;
                
                try {
                    // Check if user exists
                    const result = await db.query('SELECT * FROM users WHERE email = $1', [user.email.toLowerCase()]);
                    let dbUser = result.rows[0];

                    if (!dbUser) {
                        // Create user for google account mapping
                        const insertResult = await db.query(
                            `INSERT INTO users (email, name, password_hash, email_verified) 
                             VALUES ($1, $2, $3, true) RETURNING *`,
                            [user.email.toLowerCase(), user.name || 'Google User', 'oauth_placeholder']
                        );
                        dbUser = insertResult.rows[0];
                    }
                    
                    // Setup user id for JWT handling in NextAuth
                    user.id = dbUser.id;
                    return true;
                } catch (error) {
                    console.error('Error during Google sign-in:', error);
                    return false;
                }
            }
            return true;
        }
    }
});
