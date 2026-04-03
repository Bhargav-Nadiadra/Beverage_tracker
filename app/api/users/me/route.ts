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
        const { dailyGoal } = body;
        
        // Parse dailyGoal, allowing null
        const parsedGoal = dailyGoal === null || dailyGoal === '' ? null : parseInt(dailyGoal, 10);
        
        if (parsedGoal !== null && (isNaN(parsedGoal) || parsedGoal <= 0)) {
            return new NextResponse('Invalid daily goal', { status: 400 });
        }

        await db.query(`UPDATE users SET daily_goal = $1 WHERE id = $2`, [parsedGoal, session.user.id]);

        return NextResponse.json({ success: true, dailyGoal: parsedGoal });
    } catch (error) {
        console.error('Update User Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
