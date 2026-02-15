import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOrganizationSchema } from '@/lib/validations';
import { auth } from '@/auth';
import { isValidSlug, makeSlugUnique } from '@/lib/slug';

/**
 * POST /api/organizations
 * Create a new organization
 * 
 * Request Body:
 * - name: string (required)
 * - slug: string (required)
 * 
 * Response:
 * - 201: Organization created successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 409: Slug already exists (if manual check failed)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authentication
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in to create an organization.' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. Parse and Validate Request Body
        const body = await request.json();
        const validationResult = createOrganizationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { name, slug } = validationResult.data;

        // 3. Validate Slug Format
        if (!isValidSlug(slug)) {
            return NextResponse.json(
                { error: 'Invalid slug format' },
                { status: 400 }
            );
        }

        // 4. Check Slug Uniqueness
        const existingOrgResult = await db.query(
            'SELECT id FROM organizations WHERE slug = $1',
            [slug]
        );

        if (existingOrgResult.rows.length > 0) {
            return NextResponse.json(
                { error: 'Organization identifier (slug) is already taken. Please choose another one.' },
                { status: 409 }
            );
        }

        // 5. Create Organization and Membership Transaction
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Create Organization
            const orgResult = await client.query(
                `INSERT INTO organizations (name, slug) 
         VALUES ($1, $2) 
         RETURNING *`,
                [name, slug]
            );
            const organization = orgResult.rows[0];

            // Create Admin Membership
            await client.query(
                `INSERT INTO organization_members (user_id, organization_id, role) 
         VALUES ($1, $2, 'ADMIN')`,
                [userId, organization.id]
            );

            await client.query('COMMIT');

            return NextResponse.json(
                {
                    message: 'Organization created successfully',
                    organization,
                },
                { status: 201 }
            );
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create organization error:', error);
        return NextResponse.json(
            { error: 'An error occurred while creating the organization.' },
            { status: 500 }
        );
    }
}
