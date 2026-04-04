import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PeakHourHeatmap } from '@/components/charts/PeakHourHeatmap';
import { OrganizationManager } from '@/components/dashboard/OrganizationManager';

export default async function AdminReportsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const userId = session.user.id as string;

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

    const orgId = membership.org_id as string;

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
            u.id as user_id,
            u.name,
            u.email,
            om.role,
            SUM(CASE WHEN bl.beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea_total,
            SUM(CASE WHEN bl.beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee_total,
            COUNT(bl.id) as total_count,
            MAX(bl.logged_at) as last_active
         FROM users u
         JOIN organization_members om ON u.id = om.user_id
         LEFT JOIN beverage_logs bl ON u.id = bl.user_id AND bl.organization_id = $1
         WHERE om.organization_id = $1
         GROUP BY u.id, u.name, u.email, om.role
         ORDER BY (CASE WHEN om.role = 'ADMIN' THEN 0 ELSE 1 END), total_count DESC`,
        [orgId]
    );

    // 3. Peak hour heatmap data
    const peakHourResult = await db.query(
        `SELECT 
            EXTRACT(DOW FROM logged_at) as day_of_week,
            EXTRACT(HOUR FROM logged_at) as hour,
            COUNT(*) as count
         FROM beverage_logs
         WHERE organization_id = $1
         GROUP BY day_of_week, hour
         ORDER BY day_of_week, hour ASC`,
        [orgId]
    );

    const peakHourData = peakHourResult.rows.map(row => ({
        day_of_week: parseInt(row.day_of_week),
        hour: parseInt(row.hour),
        count: parseInt(row.count)
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex text-nowrap items-center">
                            <div className="flex-shrink-0 flex items-center mr-8">
                                <span className="text-xl font-bold text-green-600 dark:text-green-500">Beverage Tracker</span>
                            </div>
                            <div className="hidden sm:flex sm:space-x-8 h-full">
                                <a href="/dashboard" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/dashboard/reports" className="border-green-500 text-gray-900 dark:text-gray-100 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Reports
                                </a>
                                <a href="/dashboard/settings" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Settings
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500 font-bold border border-green-200 dark:border-green-800">
                                {session.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organization Reports</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Insights for {membership.org_name}</p>
                    </div>
                    <form action="/api/organizations/export" method="GET" className="flex flex-col sm:flex-row items-end gap-3">
                        <input type="hidden" name="orgId" value={orgId} />
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Start Date</label>
                            <input type="date" name="startDate" className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm h-[38px] w-full sm:w-36 text-gray-700 dark:text-gray-300 focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">End Date</label>
                            <input type="date" name="endDate" className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm h-[38px] w-full sm:w-36 text-gray-700 dark:text-gray-300 focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-blue-600 dark:border-blue-500 rounded-lg text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-semibold text-sm h-[38px]">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </form>
                </div>

                {/* 7-Day Trend Card */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Last 7 Days Consumption</h3>
                    <div className="space-y-4">
                        {trendResult.rows.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No data found for the last 7 days.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider">Tea</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Coffee</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {trendResult.rows.map((row) => (
                                            <tr key={row.date}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">{row.tea_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-700 dark:text-amber-500">{row.coffee_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">{parseInt(row.tea_count) + parseInt(row.coffee_count)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Peak Hour Heatmap (Admin exclusive insight) */}
                <PeakHourHeatmap data={peakHourData} title="Peak Daily Usage Hours" />

                {/* Member Management Section */}
                <OrganizationManager 
                    members={membersResult.rows.map(m => ({ 
                        ...m, 
                        total_count: parseInt(m.total_count), 
                        tea_total: parseInt(m.tea_total || '0'), 
                        coffee_total: parseInt(m.coffee_total || '0'),
                        last_active: m.last_active ? m.last_active.toISOString() : null 
                    }))} 
                    orgId={orgId} 
                    currentUserId={userId} 
                />
            </main>
        </div>
    );
}
