import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

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
        const logsResult = await db.query(
            `SELECT 
                bl.id,
                u.name as user_name,
                u.email as user_email,
                bl.beverage_type,
                bl.logged_at
             FROM beverage_logs bl
             JOIN users u ON bl.user_id = u.id
             WHERE bl.organization_id = $1
             ORDER BY bl.logged_at DESC`,
            [orgId]
        );

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

        // 4. Return as downloadable file
        const filename = `beverage_report_${new Date().toISOString().split('T')[0]}.csv`;

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
