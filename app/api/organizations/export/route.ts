import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!session?.user || !orgId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;

        // 1. Verify admin permissions
        const adminCheck = await db.query(
            `SELECT role FROM organization_members 
             WHERE user_id = $1 AND organization_id = $2 AND role = 'ADMIN'`,
            [userId, orgId]
        );

        if (adminCheck.rows.length === 0) {
            return new NextResponse('Forbidden: Admin access required', { status: 403 });
        }

        // 2. Fetch all logs with user details
        let query = `SELECT 
                bl.id,
                u.name as user_name,
                u.email as user_email,
                bl.beverage_type,
                bl.logged_at
             FROM beverage_logs bl
             JOIN users u ON bl.user_id = u.id
             WHERE bl.organization_id = $1`;
        
        const params: any[] = [orgId];

        if (startDate) {
            params.push(startDate);
            query += ` AND bl.logged_at >= $${params.length}`;
        }
        
        if (endDate) {
            params.push(`${endDate} 23:59:59.999Z`);
            query += ` AND bl.logged_at <= $${params.length}`;
        }
        
        query += ` ORDER BY bl.logged_at DESC`;

        const logsResult = await db.query(query, params);

        // 3. Convert to CSV
        const headers = ['Log ID', 'User Name', 'User Email', 'Beverage Type', 'Logged At (UTC)'];
        const csvRows = logsResult.rows.map(row => [
            row.id,
            `"${row.user_name.replace(/"/g, '""')}"`,
            row.user_email,
            row.beverage_type,
            row.logged_at.toISOString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        // 4. Get org slug for filename
        const orgInfo = await db.query(`SELECT slug FROM organizations WHERE id = $1`, [orgId]);
        const orgSlug = orgInfo.rows[0]?.slug || 'org';

        // 5. Return as downloadable file
        let filenameSuffix = new Date().toISOString().split('T')[0];
        if (startDate && endDate) {
            filenameSuffix = `${startDate}_to_${endDate}`;
        } else if (startDate) {
            filenameSuffix = `since_${startDate}`;
        } else if (endDate) {
            filenameSuffix = `until_${endDate}`;
        }
        
        const filename = `${orgSlug}_beverage_report_${filenameSuffix}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Export Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
