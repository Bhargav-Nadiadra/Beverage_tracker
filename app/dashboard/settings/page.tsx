import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';

import { ThemeToggle } from '@/components/ThemeToggle';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const result = await db.query(
        'SELECT name, daily_goal, avatar_url, default_beverage, notifications_enabled FROM users WHERE id = $1',
        [session.user.id]
    );
    const profile = result.rows[0];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-green-600 dark:text-green-500">Beverage Tracker</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 h-full">
                                <a href="/dashboard" className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/dashboard/settings" className="border-green-500 text-gray-900 dark:text-gray-100 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
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

            <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Personal Settings</h1>
                
                <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal Preferences</h3>
                        <p className="mt-1 max-w-2xl text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Your custom beverage tracking dashboard</p>
                    </div>
                    <div className="px-8 py-10">
                        <ProfileSettingsForm profile={profile} />
                    </div>

                </div>
            </main>
        </div>
    );
}
