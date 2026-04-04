import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createChallengeSchema } from '@/lib/validations';

/**
 * GET /api/challenges
 * Fetch active challenges for the user's organization
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch user's organization
        const orgResult = await db.query(
            `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        const orgId = orgResult.rows[0]?.organization_id;

        if (!orgId) {
            return NextResponse.json({ challenges: [] });
        }

        // Fetch active/upcoming challenges
        const challengesResult = await db.query(
            `SELECT c.*, u.name as creator_name
             FROM challenges c
             JOIN users u ON c.created_by = u.id
             WHERE c.organization_id = $1
             AND c.end_date >= CURRENT_TIMESTAMP
             ORDER BY c.start_date ASC`,
            [orgId]
        );

        return NextResponse.json({ challenges: challengesResult.rows });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/challenges
 * Create a new challenge (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Verify admin role
        const roleResult = await db.query(
            `SELECT role, organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        const { role, organization_id: orgId } = roleResult.rows[0] || {};

        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        // Validate request body
        const body = await request.json();
        const validationResult = createChallengeSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { title, description, startDate, endDate, targetType, targetValue } = validationResult.data;

        // Insert into database
        const result = await db.query(
            `INSERT INTO challenges (
                organization_id, title, description, start_date, end_date, target_type, target_value, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [orgId, title, description, startDate, endDate, targetType, targetValue || null, userId]
        );

        return NextResponse.json({ challenge: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating challenge:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
