import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/challenges/[id]/leaderboard
 * Fetch the leaderboard for a specific challenge
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: challengeId } = await params;

        // Fetch challenge details
        const challengeResult = await db.query(
            `SELECT * FROM challenges WHERE id = $1 LIMIT 1`,
            [challengeId]
        );

        const challenge = challengeResult.rows[0];

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        const { organization_id: orgId, start_date, end_date, target_type } = challenge;

        // Calculate leaderboard based on logs within the timeframe
        // Filtering by org_id ensures safety
        let scoreQuery = '';
        
        switch(target_type) {
            case 'MOST_LOGS':
                scoreQuery = 'COUNT(bl.id)';
                break;
            case 'MOST_TEA':
                scoreQuery = "SUM(CASE WHEN bl.beverage_type = 'TEA' THEN 1 ELSE 0 END)";
                break;
            case 'MOST_COFFEE':
                scoreQuery = "SUM(CASE WHEN bl.beverage_type = 'COFFEE' THEN 1 ELSE 0 END)";
                break;
            case 'LEAST_LOGS':
                scoreQuery = 'COUNT(bl.id)'; // We'll sort ASC for this one
                break;
            default:
                scoreQuery = 'COUNT(bl.id)';
        }

        const leaderboardResult = await db.query(
            `SELECT u.name, ${scoreQuery} as score
             FROM users u
             JOIN organization_members om ON u.id = om.user_id
             LEFT JOIN beverage_logs bl ON u.id = bl.user_id 
                AND bl.organization_id = $1 
                AND bl.logged_at >= $2 
                AND bl.logged_at <= $3
             WHERE om.organization_id = $1
             AND u.privacy_visible = TRUE
             GROUP BY u.id, u.name
             ORDER BY score ${target_type === 'LEAST_LOGS' ? 'ASC' : 'DESC'}
             LIMIT 10`,
            [orgId, start_date, end_date]
        );

        return NextResponse.json({ 
            challenge,
            leaderboard: leaderboardResult.rows.map(row => ({
                ...row,
                score: parseInt(row.score || '0', 10)
            }))
        });
    } catch (error) {
        console.error('Error fetching challenge leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
