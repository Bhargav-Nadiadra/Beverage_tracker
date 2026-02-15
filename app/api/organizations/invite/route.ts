import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { z } from 'zod';
import { generateInvitationToken, getInvitationTokenExpiry } from '@/lib/tokens';
import { sendInvitationEmail } from '@/lib/email';

const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    organizationId: z.string().uuid('Invalid organization ID'),
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
        const validationResult = inviteSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { email, organizationId } = validationResult.data;
        const invitedEmail = email.toLowerCase();

        // 1. Check if the current user is an admin of the organization
        const adminCheck = await db.query(
            `SELECT role FROM organization_members 
       WHERE user_id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );

        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can invite members' },
                { status: 403 }
            );
        }

        // 2. Check if the user is already a member of the organization
        const memberCheck = await db.query(
            `SELECT id FROM organization_members 
       WHERE organization_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)`,
            [organizationId, invitedEmail]
        );

        if (memberCheck.rows.length > 0) {
            return NextResponse.json(
                { error: 'User is already a member of this organization' },
                { status: 400 }
            );
        }

        // 3. Check for existing pending invitation
        const existingInvite = await db.query(
            `SELECT id FROM invitations 
       WHERE organization_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
            [organizationId, invitedEmail]
        );

        if (existingInvite.rows.length > 0) {
            return NextResponse.json(
                { error: 'A pending invitation already exists for this email' },
                { status: 400 }
            );
        }

        // 4. Generate invitation token and save to database
        const token = generateInvitationToken();
        const expiresAt = getInvitationTokenExpiry();

        await db.query(
            `INSERT INTO invitations (organization_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
            [organizationId, invitedEmail, userId, token, expiresAt]
        );

        // 5. Get organization details for the email
        const orgResult = await db.query(
            `SELECT name FROM organizations WHERE id = $1`,
            [organizationId]
        );
        const orgName = orgResult.rows[0].name;

        // 6. Send invitation email
        const emailResult = await sendInvitationEmail({
            email: invitedEmail,
            invitedBy: session.user.name || 'An admin',
            organizationName: orgName,
            inviteToken: token,
        });

        if (!emailResult.success) {
            console.error('Failed to send invitation email:', emailResult.error);
            // We don't fail the whole request because the invite is already in DB
            // but we should inform the user.
            return NextResponse.json(
                {
                    message: 'Invitation saved but email failed to send',
                    warning: 'Please contact the invitee manually with the link.',
                    token: token // In a real app we might not expose this unless needed
                },
                { status: 201 }
            );
        }

        return NextResponse.json(
            { message: 'Invitation sent successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error inviting member:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
