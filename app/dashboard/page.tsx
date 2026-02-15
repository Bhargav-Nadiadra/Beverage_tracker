import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import BeverageLogger from '@/components/dashboard/BeverageLogger';

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

    // ... existing no-membership check

    // Fetch today's beverage logs for the user
    const statsResult = await db.query(
        `SELECT 
            SUM(CASE WHEN beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea_count,
            SUM(CASE WHEN beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee_count
         FROM beverage_logs
         WHERE user_id = $1 
         AND logged_at >= CURRENT_DATE`,
        [userId]
    );

    const teaCount = parseInt(statsResult.rows[0]?.tea_count || '0', 10);
    const coffeeCount = parseInt(statsResult.rows[0]?.coffee_count || '0', 10);

    // With raw SQL join, we access properties directly from the flat row
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

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Welcome back, {session.user.name}. Here's your daily summary.
                        </p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <BeverageLogger initialTeaCount={teaCount} initialCoffeeCount={coffeeCount} />
                    </div>
                </div>
            </main>
        </div>
    );
}
