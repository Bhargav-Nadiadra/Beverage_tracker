'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Log {
    id: string;
    beverage_type: 'TEA' | 'COFFEE';
    logged_at: string;
}

interface BeverageLoggerProps {
    initialTeaCount: number;
    initialCoffeeCount: number;
    initialFirstLog: string | null;
    initialLastLog: string | null;
    todayLogs: Log[];
    dailyGoal: number | null;
}

export default function BeverageLogger({
    initialTeaCount,
    initialCoffeeCount,
    initialFirstLog,
    initialLastLog,
    todayLogs: serverLogs,
    dailyGoal
}: BeverageLoggerProps) {
    const [teaCount, setTeaCount] = useState(initialTeaCount);
    const [coffeeCount, setCoffeeCount] = useState(initialCoffeeCount);
    const [firstLog, setFirstLog] = useState<string | null>(initialFirstLog);
    const [lastLog, setLastLog] = useState<string | null>(initialLastLog);
    const [logs, setLogs] = useState<Log[]>(serverLogs);
    const [loading, setLoading] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const logBeverage = async (type: 'TEA' | 'COFFEE') => {
        setLoading(type);

        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ beverageType: type }),
            });

            if (!response.ok) {
                alert('Failed to log beverage. Please try again.');
            } else {
                const data = await response.json();
                const newLog = {
                    id: data.log.id,
                    beverage_type: data.log.beverage_type,
                    logged_at: data.log.logged_at
                };

                // Update local state
                if (type === 'TEA') setTeaCount(prev => prev + 1);
                else setCoffeeCount(prev => prev + 1);

                setLogs(prev => [newLog, ...prev]);

                if (!firstLog) setFirstLog(newLog.logged_at);
                setLastLog(newLog.logged_at);

                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setLoading(null);
        }
    };

    const deleteLog = async (id: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return;

        setDeletingId(id);
        try {
            const response = await fetch(`/api/logs?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const msg = await response.text();
                alert(`Failed to delete: ${msg}`);
            } else {
                // Update local state
                const deletedLog = logs.find(l => l.id === id);
                if (deletedLog) {
                    if (deletedLog.beverage_type === 'TEA') setTeaCount(prev => prev - 1);
                    else setCoffeeCount(prev => prev - 1);
                }

                const updatedLogs = logs.filter(l => l.id !== id);
                setLogs(updatedLogs);

                // Update timestamps if necessary
                if (updatedLogs.length === 0) {
                    setFirstLog(null);
                    setLastLog(null);
                } else {
                    setFirstLog(updatedLogs[updatedLogs.length - 1].logged_at);
                    setLastLog(updatedLogs[0].logged_at);
                }

                router.refresh();
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while deleting.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 w-full">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8 uppercase tracking-widest">Quick Log</h2>

                <div className="flex flex-wrap gap-12 justify-center w-full">
                    {/* Coffee Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => logBeverage('COFFEE')}
                            disabled={loading !== null}
                            className="w-32 h-32 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900 dark:hover:to-amber-800 text-amber-900 dark:text-amber-100 border-2 border-amber-200 dark:border-amber-800 transition-all active:scale-90 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <span className="text-5xl mb-2">☕</span>
                            <span className="font-bold text-xs">COFFEE</span>
                        </button>
                        <div className="text-amber-800 dark:text-amber-200 font-bold bg-amber-50 dark:bg-amber-900/50 px-4 py-1 rounded-full text-sm border border-amber-200 dark:border-amber-800">
                            Today: {coffeeCount}
                        </div>
                    </div>

                    {/* Tea Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => logBeverage('TEA')}
                            disabled={loading !== null}
                            className="w-32 h-32 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900 dark:hover:to-emerald-800 text-emerald-900 dark:text-emerald-100 border-2 border-emerald-200 dark:border-emerald-800 transition-all active:scale-90 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <span className="text-5xl mb-2">🍵</span>
                            <span className="font-bold text-xs">TEA</span>
                        </button>
                        <div className="text-emerald-800 dark:text-emerald-200 font-bold bg-emerald-50 dark:bg-emerald-900/50 px-4 py-1 rounded-full text-sm border border-emerald-200 dark:border-emerald-800">
                            Today: {teaCount}
                        </div>
                    </div>
                </div>

                {dailyGoal && (
                    <div className="w-full mt-8 px-4">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Daily Goal Progress</span>
                            <span className={`text-xs font-bold ${(teaCount + coffeeCount) > dailyGoal ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {teaCount + coffeeCount} / {dailyGoal}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 shadow-inner overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 shadow-sm ${(teaCount + coffeeCount) > dailyGoal ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, ((teaCount + coffeeCount) / dailyGoal) * 100)}%` }}
                            ></div>
                        </div>
                        {(teaCount + coffeeCount) > dailyGoal && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                You've exceeded your daily limit!
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-10 pt-6 border-t border-gray-50 dark:border-gray-800 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Sunrise</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-base">{formatTime(firstLog)}</span>
                    </div>
                    <div className="flex flex-col border-x border-gray-50 dark:border-gray-800 px-4">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Daily Cup Count</span>
                        <span className="font-black text-gray-900 dark:text-gray-100 text-2xl text-green-600 dark:text-green-500 leading-none">{teaCount + coffeeCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Last Pour</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-base">{formatTime(lastLog)}</span>
                    </div>
                </div>
            </div>

            {/* Today's History (Log Deletion) */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Today's History</h3>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 italic">Delete only available for today</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm italic">No beverages logged today yet.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-xl">
                                        {log.beverage_type === 'TEA' ? '🍵' : '☕'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {log.beverage_type}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatTime(log.logged_at)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteLog(log.id)}
                                    disabled={deletingId === log.id}
                                    className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    title="Delete Log"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
