import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Fetch user's organization
    const result = await db.query(
        `SELECT om.*, o.name as org_name, o.slug as org_slug
     FROM organization_members om
     JOIN organizations o ON om.organization_id = o.id
     WHERE om.user_id = $1
     LIMIT 1`,
        [userId]
    );

    const membership = result.rows[0];

    if (!membership) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Beverage Tracker!</h1>
                    <p className="text-gray-600 mb-6">
                        You are not part of any organization yet. To get started, you can create a new organization for your team.
                    </p>
                    <a
                        href="/create-organization"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                    >
                        Create Organization
                    </a>
                </div>
            </div>
        );
    }

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
                        {/* Placeholder for US-3: Tea Logging */}
                        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500 mb-4">Beverage logging will be implemented in the next story.</p>
                            <div className="flex justify-center gap-4">
                                <button disabled className="bg-gray-200 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed">
                                    ☕ Log Coffee
                                </button>
                                <button disabled className="bg-gray-200 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed">
                                    🍵 Log Tea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
