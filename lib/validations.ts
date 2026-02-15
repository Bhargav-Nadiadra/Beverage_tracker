import { z } from 'zod';

/**
 * User Sign Up Validation Schema
 * Requirements:
 * - Email must be valid format
 * - Password must be at least 8 characters
 * - Password must contain at least 1 number
 * - Password must contain at least 1 special character
 * - Name is required
 */
export const signUpSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Email Verification Schema
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Login Schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Organization Creation Schema
 */
export const createOrganizationSchema = z.object({
    name: z
        .string()
        .min(1, 'Organization name is required')
        .max(50, 'Name must be less than 50 characters'),
    slug: z
        .string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug must be less than 50 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
