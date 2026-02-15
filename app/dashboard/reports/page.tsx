import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminReportsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Fetch user's organization and check admin role
    const orgResult = await db.query(
        `SELECT om.*, o.name as org_name, o.id as org_id
         FROM organization_members om
         JOIN organizations o ON om.organization_id = o.id
         WHERE om.user_id = $1 AND om.role = 'ADMIN'
         LIMIT 1`,
        [userId]
    );

    const membership = orgResult.rows[0];

    if (!membership) {
        // Not an admin or not in an org
        redirect('/dashboard');
    }

    const orgId = membership.org_id;

    // 1. Weekly Consumption Trend (Last 7 Days)
    const trendResult = await db.query(
        `SELECT 
            DATE(logged_at) as date,
            SUM(CASE WHEN beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea_count,
            SUM(CASE WHEN beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee_count
         FROM beverage_logs
         WHERE organization_id = $1
         AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY DATE(logged_at)
         ORDER BY date DESC`,
        [orgId]
    );

    // 2. Member Breakdown (Total Logs)
    const membersResult = await db.query(
        `SELECT 
            u.name,
            u.email,
            SUM(CASE WHEN bl.beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea_total,
            SUM(CASE WHEN bl.beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee_total,
            COUNT(bl.id) as total_count,
            MAX(bl.logged_at) as last_active
         FROM users u
         JOIN organization_members om ON u.id = om.user_id
         LEFT JOIN beverage_logs bl ON u.id = bl.user_id AND bl.organization_id = $1
         WHERE om.organization_id = $1
         GROUP BY u.id, u.name, u.email
         ORDER BY total_count DESC`,
        [orgId]
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-green-600">Beverage Tracker</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/dashboard/reports" className="border-green-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Reports
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                                {session.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organization Reports</h1>
                        <p className="mt-1 text-sm text-gray-500">Insights for {membership.org_name}</p>
                    </div>
                    <form action="/api/organizations/export" method="GET">
                        <input type="hidden" name="orgId" value={orgId} />
                        <button type="submit" className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg text-blue-600 hover:bg-blue-50 transition font-semibold text-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export to CSV
                        </button>
                    </form>
                </div>

                {/* 7-Day Trend Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Last 7 Days Consumption</h3>
                    <div className="space-y-4">
                        {trendResult.rows.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">No data found for the last 7 days.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-green-600 uppercase tracking-wider">Tea</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Coffee</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {trendResult.rows.map((row) => (
                                            <tr key={row.date}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{row.tea_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-700">{row.coffee_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{parseInt(row.tea_count) + parseInt(row.coffee_count)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Member Breakdown Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Member Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tea Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coffee Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {membersResult.rows.map((member) => (
                                    <tr key={member.email}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-0">
                                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                    <div className="text-sm text-gray-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{member.tea_total || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-700 font-medium">{member.coffee_total || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{member.total_count || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.last_active ? new Date(member.last_active).toLocaleString() : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
