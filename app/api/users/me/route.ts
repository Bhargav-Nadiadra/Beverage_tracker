import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { dailyGoal, name, avatarUrl, defaultBeverage, notificationsEnabled, privacyVisible, timezone } = body;
        
        const updates: string[] = [];
        const values: any[] = [];
        let counter = 1;

        if (dailyGoal !== undefined) {
            const parsedGoal = dailyGoal === null || dailyGoal === '' ? null : parseInt(dailyGoal, 10);
            if (parsedGoal !== null && (isNaN(parsedGoal) || parsedGoal <= 0)) {
                return new NextResponse('Invalid daily goal', { status: 400 });
            }
            updates.push(`daily_goal = $${counter++}`);
            values.push(parsedGoal);
        }

        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return new NextResponse('Name is required', { status: 400 });
            }
            updates.push(`name = $${counter++}`);
            values.push(name.trim());
        }

        if (avatarUrl !== undefined) {
            updates.push(`avatar_url = $${counter++}`);
            values.push(avatarUrl);
        }

        if (defaultBeverage !== undefined) {
            if (!['TEA', 'COFFEE'].includes(defaultBeverage)) {
                return new NextResponse('Invalid beverage type', { status: 400 });
            }
            updates.push(`default_beverage = $${counter++}`);
            values.push(defaultBeverage);
        }

        if (notificationsEnabled !== undefined) {
            updates.push(`notifications_enabled = $${counter++}`);
            values.push(!!notificationsEnabled);
        }

        if (privacyVisible !== undefined) {
            updates.push(`privacy_visible = $${counter++}`);
            values.push(!!privacyVisible);
        }

        if (timezone !== undefined) {
            updates.push(`timezone = $${counter++}`);
            values.push(timezone);
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: true, message: 'No changes provided' });
        }

        values.push(session.user.id);
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${counter} RETURNING *`;
        
        const result = await db.query(query, values);

        return NextResponse.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Update User Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
