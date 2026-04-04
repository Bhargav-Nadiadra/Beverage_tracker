import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/organizations/[id]/invites/bulk
 * Send multiple invitations to an organization
 */
export async function POST(
    request: NextRequest,
    params: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: orgId } = await params.params;

        // Verify current user is admin of this org
        const adminCheck = await db.query(
            'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [orgId, session.user.id]
        );

        if (adminCheck.rows[0]?.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await request.json();
        const { emails } = body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
        }

        let inviteCount = 0;

        for (const email of emails) {
            // Check if user already exists in organization
            const memberCheck = await db.query(
                `SELECT 1 FROM organization_members om 
                 JOIN users u ON om.user_id = u.id 
                 WHERE om.organization_id = $1 AND u.email = $2`,
                [orgId, email]
            );

            if (memberCheck.rows.length > 0) continue;

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            await db.query(
                `INSERT INTO invitations (organization_id, email, invited_by, token, expires_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orgId, email, session.user.id, token, expiresAt]
            );

            inviteCount++;
            
            // In a real app, send actual emails here
            console.log(`[INVITE] Sent to ${email} (Token: ${token})`);
        }

        return NextResponse.json({ success: true, count: inviteCount });
    } catch (error) {
        console.error('Bulk Invite Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
