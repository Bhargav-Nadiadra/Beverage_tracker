import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import BeverageLogger from '@/components/dashboard/BeverageLogger';
import InviteMemberForm from '@/components/organizations/InviteMemberForm';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Fetch user's organization
    const orgResult = await db.query(
        `SELECT om.*, o.name as org_name, o.slug as org_slug
     FROM organization_members om
     JOIN organizations o ON om.organization_id = o.id
     WHERE om.user_id = $1
     LIMIT 1`,
        [userId]
    );

    const membership = orgResult.rows[0];

    // If no membership, we might want to redirect them to join/create an org
    // but for now we'll just handle it gracefully
    if (!membership) {
        redirect('/create-organization');
    }

    // Fetch today's beverage logs for the user
    const statsResult = await db.query(
        `SELECT 
            SUM(CASE WHEN beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea_count,
            SUM(CASE WHEN beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee_count,
            MIN(logged_at) as first_log,
            MAX(logged_at) as last_log
         FROM beverage_logs
         WHERE user_id = $1 
         AND logged_at >= CURRENT_DATE`,
        [userId]
    );

    const teaCount = parseInt(statsResult.rows[0]?.tea_count || '0', 10);
    const coffeeCount = parseInt(statsResult.rows[0]?.coffee_count || '0', 10);
    const firstLog = statsResult.rows[0]?.first_log ? new Date(statsResult.rows[0].first_log).toISOString() : null;
    const lastLog = statsResult.rows[0]?.last_log ? new Date(statsResult.rows[0].last_log).toISOString() : null;

    const orgName = membership.org_name;
    const role = membership.role;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-green-600">Beverage Tracker</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">
                                {orgName} <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">{role}</span>
                            </span>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                                {session.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Welcome back, {session.user.name}. Here's your daily summary.
                        </p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <BeverageLogger
                            initialTeaCount={teaCount}
                            initialCoffeeCount={coffeeCount}
                            initialFirstLog={firstLog}
                            initialLastLog={lastLog}
                        />
                    </div>
                </div>

                {role === 'ADMIN' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <InviteMemberForm organizationId={membership.organization_id} />
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Team Insights</h3>
                            <p className="text-sm text-gray-500">
                                Detailed team analytics will be available in User Story 6.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
