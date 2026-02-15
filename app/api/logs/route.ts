import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';

const logBeverageSchema = z.object({
    beverageType: z.enum(['TEA', 'COFFEE']),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        const body = await request.json();
        const validationResult = logBeverageSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { beverageType } = validationResult.data;

        // Get user's organization
        // For MVP, we assume user belongs to one organization.
        // If multiple, we pick the first one.
        const orgResult = await db.query(
            `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
            [userId]
        );

        if (orgResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'User is not a member of any organization' },
                { status: 403 }
            );
        }

        const organizationId = orgResult.rows[0].organization_id;

        // Log the beverage
        const result = await db.query(
            `INSERT INTO beverage_logs (user_id, organization_id, beverage_type)
       VALUES ($1, $2, $3)
       RETURNING id, beverage_type, logged_at`,
            [userId, organizationId, beverageType]
        );

        return NextResponse.json(
            { message: 'Beverage logged successfully', log: result.rows[0] },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error logging beverage:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const logId = searchParams.get('id');

        if (!logId) {
            return new NextResponse('Log ID is required', { status: 400 });
        }

        const userId = session.user.id;

        // Verify the log exists, belongs to the user, and was created today
        const logResult = await db.query(
            `SELECT id, logged_at FROM beverage_logs 
             WHERE id = $1 AND user_id = $2`,
            [logId, userId]
        );

        if (logResult.rows.length === 0) {
            return new NextResponse('Log not found', { status: 404 });
        }

        const log = logResult.rows[0];
        // Compare dates in local time or UTC? The dashboard uses CURRENT_DATE which is based on DB time.
        // We'll compare with current date string.
        const loggedDate = new Date(log.logged_at).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        if (loggedDate !== today) {
            return new NextResponse('Can only delete logs from today', { status: 403 });
        }

        // Delete the log
        await db.query(
            'DELETE FROM beverage_logs WHERE id = $1',
            [logId]
        );

        return new NextResponse('Log deleted', { status: 200 });

    } catch (error) {
        console.error('Delete Log Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
