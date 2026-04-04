import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import BeverageLogger from '@/components/dashboard/BeverageLogger';
import { AdminTools } from '@/components/dashboard/AdminTools';
import { calculateStreaks } from '@/lib/streaks';

import { ThemeToggle } from '@/components/ThemeToggle';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { ActiveChallenges } from '@/components/dashboard/ActiveChallenges';


export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Fetch user's organization
    const orgResult = await db.query(
        `SELECT om.*, o.name as org_name, o.slug as org_slug, o.id as org_id
     FROM organization_members om
     JOIN organizations o ON om.organization_id = o.id
     WHERE om.user_id = $1
     LIMIT 1`,
        [userId]
    );

    const membership = orgResult.rows[0];

    if (!membership) {
        redirect('/create-organization');
    }

    const orgId = membership.org_id;

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

    // Fetch today's raw logs for deletion management
    const todayLogsResult = await db.query(
        `SELECT id, beverage_type, logged_at 
         FROM beverage_logs 
         WHERE user_id = $1 
         AND logged_at >= CURRENT_DATE
         ORDER BY logged_at DESC`,
        [userId]
    );

    const todayLogs = todayLogsResult.rows.map(row => ({
        ...row,
        logged_at: row.logged_at.toISOString()
    }));

    // Fetch Team Activity (Last 10 logs)
    const activityResult = await db.query(
        `SELECT bl.*, u.name as user_name
         FROM beverage_logs bl
         JOIN users u ON bl.user_id = u.id
         WHERE bl.organization_id = $1
         ORDER BY bl.logged_at DESC
         LIMIT 10`,
        [orgId]
    );

    // Fetch Team Leaderboard (Today)
    const leaderboardResult = await db.query(
        `SELECT u.name, COUNT(*) as count
         FROM beverage_logs bl
         JOIN users u ON bl.user_id = u.id
         WHERE bl.organization_id = $1
         AND bl.logged_at >= CURRENT_DATE
         GROUP BY u.name
         ORDER BY count DESC
         LIMIT 5`,
        [orgId]
    );

    // Fetch Team Total (Today)
    const teamTotalResult = await db.query(
        `SELECT COUNT(*) as total
         FROM beverage_logs
         WHERE organization_id = $1
         AND logged_at >= CURRENT_DATE`,
        [orgId]
    );

    const teamTotal = parseInt(teamTotalResult.rows[0]?.total || '0', 10);
    const activity = activityResult.rows.map(row => ({
        ...row,
        logged_at: row.logged_at.toISOString()
    }));
    const leaderboard = leaderboardResult.rows.map(row => ({
        name: row.name,
        count: parseInt(row.count, 10)
    }));

    // Fetch Personal Weekly Stats
    const weeklyStatsResult = await db.query(
        `SELECT 
            DATE(logged_at) as date,
            SUM(CASE WHEN beverage_type = 'TEA' THEN 1 ELSE 0 END) as tea,
            SUM(CASE WHEN beverage_type = 'COFFEE' THEN 1 ELSE 0 END) as coffee
         FROM beverage_logs
         WHERE user_id = $1
         AND logged_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY DATE(logged_at)
         ORDER BY date ASC`,
        [userId]
    );

    const weeklyStats = weeklyStatsResult.rows.map(row => ({
        ...row,
        date: row.date.toISOString(),
        tea: parseInt(row.tea),
        coffee: parseInt(row.coffee)
    }));

    // Fetch 90-day activity for heatmap
    const activityHeatmapResult = await db.query(
        `SELECT 
            DATE(logged_at) as date,
            COUNT(*) as count
         FROM beverage_logs
         WHERE user_id = $1
         AND logged_at >= CURRENT_DATE - INTERVAL '90 days'
         GROUP BY DATE(logged_at)
         ORDER BY date ASC`,
        [userId]
    );

    const activityHeatmapData = activityHeatmapResult.rows.map(row => ({
        date: row.date.toISOString(),
        count: parseInt(row.count)
    }));

    // Fetch dates for streak calculation
    const streakDatesResult = await db.query(
        `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') as log_date
         FROM beverage_logs 
         WHERE user_id = $1 
         ORDER BY log_date DESC`,
        [userId]
    );
    const streakDates = streakDatesResult.rows.map(row => new Date(row.log_date));
    const streakStats = calculateStreaks(streakDates);

    const userResult = await db.query('SELECT daily_goal FROM users WHERE id = $1', [userId]);
    const dailyGoal = userResult.rows[0]?.daily_goal || null;

    const orgName = membership.org_name;
    const role = membership.role;

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
                                <a href="/dashboard" className="border-green-500 text-gray-900 dark:text-gray-100 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                {role === 'ADMIN' && (
                                    <a href="/dashboard/reports" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                        Reports
                                    </a>
                                )}
                                <a href="/dashboard/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center px-1 pt-4 border-b-2 text-sm font-medium">
                                    Settings
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <span className="text-gray-700 dark:text-gray-300 hidden sm:inline-flex">
                                {orgName} <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded ml-2">{role}</span>
                            </span>
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500 font-bold border border-green-200 dark:border-green-800">
                                {session.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Personal Logger */}
                        <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
                            <div className="px-4 py-5 sm:px-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Dashboard</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Welcome back, {session.user.name}. Here's your daily summary.
                                </p>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <BeverageLogger
                                    initialTeaCount={teaCount}
                                    initialCoffeeCount={coffeeCount}
                                    initialFirstLog={firstLog}
                                    initialLastLog={lastLog}
                                    todayLogs={todayLogs}
                                    dailyGoal={dailyGoal}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* User Streak */}
                            <UserStreakCard streakStats={streakStats} />

                            {/* Personal Trends */}
                            <PersonalTrends weeklyStats={weeklyStats} />

                            {/* Personal Activity Heatmap */}
                            <div className="xl:col-span-2">
                                <ActivityHeatmap data={activityHeatmapData} title="Yearly Intensity" />
                            </div>
                        </div>

                        {/* Recent Team Activity */}
                        <TeamActivity activity={activity} />
                    </div>

                    <div className="space-y-8">
                        {/* Team Leaderboard */}
                        <TeamLeaderboard leaderboard={leaderboard} teamTotal={teamTotal} />

                        {/* Team Challenges */}
                        <ActiveChallenges />

                        {/* Admin Tools */}
                        {role === 'ADMIN' && (
                            <AdminTools organizationId={orgId} />
                        )}


                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper components for the dashboard
function PersonalTrends({ weeklyStats }: { weeklyStats: any[] }) {
    const maxVal = Math.max(...weeklyStats.map(s => s.tea + s.coffee), 1);

    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Weekly Trends</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your consumption over the last 7 days</p>
            </div>
            <div className="px-4 py-8 sm:p-6">
                {weeklyStats.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 italic text-sm">No data for the past week.</div>
                ) : (
                    <div className="grid grid-cols-7 gap-2 items-end h-40">
                        {weeklyStats.map((day) => (
                            <div key={day.date} className="flex flex-col items-center group relative h-full justify-end">
                                <div className="flex flex-col w-full px-1 space-y-0.5">
                                    <div
                                        className="bg-green-500 w-full rounded-t-sm transition-all duration-300 hover:brightness-110"
                                        style={{ height: `${(day.tea / maxVal) * 100}%` }}
                                        title={`${day.tea} Tea`}
                                    ></div>
                                    <div
                                        className="bg-amber-700 w-full rounded-b-sm transition-all duration-300 hover:brightness-110"
                                        style={{ height: `${(day.coffee / maxVal) * 100}%` }}
                                        title={`${day.coffee} Coffee`}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-2 font-medium">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>

                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
                                        🍵 {day.tea} | ☕ {day.coffee}
                                    </div>
                                    <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-6 flex justify-center gap-4 text-xs font-medium border-t border-gray-50 dark:border-gray-800 pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                        <span className="text-gray-600 dark:text-gray-300">Tea</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-amber-700 rounded-sm"></div>
                        <span className="text-gray-600 dark:text-gray-300">Coffee</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamActivity({ activity }: { activity: any[] }) {
    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Recent Team Activity</h3>
            </div>
            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800">
                    {activity.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 italic text-sm">No activity yet. Be the first!</li>
                    ) : (
                        activity.map((log) => (
                            <li key={log.id} className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            {log.beverage_type === 'TEA' ? '🍵' : '☕'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {log.user_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            Logged a {log.beverage_type.toLowerCase()} • {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

function TeamLeaderboard({ leaderboard, teamTotal }: { leaderboard: any[], teamTotal: number }) {
    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <h3 className="text-lg leading-6 font-semibold text-green-900 dark:text-green-100">Today's Standings</h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300 font-medium">✨ {teamTotal} cups shared by the team!</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <div className="space-y-5">
                    {leaderboard.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 italic text-sm py-4">The leaderboard is empty today.</p>
                    ) : (
                        leaderboard.map((user, index) => (
                            <div key={user.name} className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-500' :
                                    index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                                        index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-500' :
                                            'text-gray-400 dark:text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</span>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">{user.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 shadow-inner">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500 shadow-sm"
                                            style={{ width: `${Math.min(100, (user.count / (leaderboard[0]?.count || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function UserStreakCard({ streakStats }: { streakStats: { current: number, longest: number } }) {
    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Your Streak</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keep it up! Log every day to maintain your streak.</p>
            </div>
            <div className="px-4 py-8 sm:p-6 flex-grow flex items-center justify-center">
                <div className="w-full flex items-center">
                    <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-800">
                        <div className="text-5xl font-black text-orange-500 dark:text-orange-400 mb-2 drop-shadow-sm">🔥 {streakStats.current}</div>
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Day Streak</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-4xl font-black text-gray-700 dark:text-gray-300 mb-2">🏆 {streakStats.longest}</div>
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Best Streak</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
