import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { isTokenExpired } from '@/lib/tokens';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const session = await auth();

        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (!session || !session.user || !session.user.id) {
            return NextResponse.redirect(new URL(`/login?invite=${token}`, request.url));
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // 1. Fetch invitation
        const inviteResult = await db.query(
            `SELECT * FROM invitations WHERE token = $1 AND accepted_at IS NULL`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            return NextResponse.redirect(new URL('/?error=invalid_invite', request.url));
        }

        const invitation = inviteResult.rows[0];

        // 2. Security checks
        if (isTokenExpired(invitation.expires_at)) {
            return NextResponse.redirect(new URL('/?error=invite_expired', request.url));
        }

        if (invitation.email !== userEmail) {
            return NextResponse.redirect(new URL('/?error=mismatched_email', request.url));
        }

        // 3. Add to organization
        // Use a transaction for consistency
        await db.query('BEGIN');
        try {
            // Add member (MEMBER role by default)
            await db.query(
                `INSERT INTO organization_members (user_id, organization_id, role)
         VALUES ($1, $2, 'MEMBER')
         ON CONFLICT (user_id, organization_id) DO NOTHING`,
                [userId, invitation.organization_id]
            );

            // Mark invite as accepted
            await db.query(
                `UPDATE invitations SET accepted_at = NOW() WHERE id = $1`,
                [invitation.id]
            );

            await db.query('COMMIT');
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

        // 4. Success - Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return NextResponse.redirect(new URL('/?error=server_error', request.url));
    }
}
