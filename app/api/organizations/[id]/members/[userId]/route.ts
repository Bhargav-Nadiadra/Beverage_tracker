import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * PATCH /api/organizations/[id]/members/[userId]
 * Update member role
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: orgId, userId: targetUserId } = await params;
        const body = await request.json();
        const { role } = body;

        if (!['ADMIN', 'MEMBER'].includes(role)) {
            return new NextResponse('Invalid role', { status: 400 });
        }

        // Verify current user is admin of this org
        const adminCheck = await db.query(
            'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [orgId, session.user.id]
        );

        if (adminCheck.rows[0]?.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Update role
        await db.query(
            'UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3',
            [role, orgId, targetUserId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Role Update Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

/**
 * DELETE /api/organizations/[id]/members/[userId]
 * Remove member from organization
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: orgId, userId: targetUserId } = await params;

        // Verify current user is admin of this org
        const adminCheck = await db.query(
            'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [orgId, session.user.id]
        );

        if (adminCheck.rows[0]?.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Remove from org (cascading logs if needed? PRD saysVisibility is for logs.
        // Actually organization_members deletion just removes relationship.
        // Usually, we keep logs for historical org data but remove membership.
        
        await db.query(
            'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [orgId, targetUserId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Member Removal Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
