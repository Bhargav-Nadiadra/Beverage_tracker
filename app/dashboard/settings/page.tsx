import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import DailyGoalForm from '@/components/settings/DailyGoalForm';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const result = await db.query('SELECT daily_goal FROM users WHERE id = $1', [session.user.id]);
    const dailyGoal = result.rows[0]?.daily_goal || null;

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
                                <a href="/dashboard/settings" className="border-green-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Settings
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Personal Settings</h1>
                
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your daily tracking goals.</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <DailyGoalForm currentGoal={dailyGoal} />
                    </div>
                </div>
            </main>
        </div>
    );
}
