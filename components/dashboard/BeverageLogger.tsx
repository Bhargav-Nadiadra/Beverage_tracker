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
}

export default function BeverageLogger({
    initialTeaCount,
    initialCoffeeCount,
    initialFirstLog,
    initialLastLog,
    todayLogs: serverLogs
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
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
                <h2 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-widest">Quick Log</h2>

                <div className="flex flex-wrap gap-12 justify-center w-full">
                    {/* Coffee Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => logBeverage('COFFEE')}
                            disabled={loading !== null}
                            className="w-32 h-32 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border-2 border-amber-200 transition-all active:scale-90 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <span className="text-5xl mb-2">☕</span>
                            <span className="font-bold text-xs">COFFEE</span>
                        </button>
                        <div className="text-amber-800 font-bold bg-amber-50 px-4 py-1 rounded-full text-sm border border-amber-200">
                            Today: {coffeeCount}
                        </div>
                    </div>

                    {/* Tea Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => logBeverage('TEA')}
                            disabled={loading !== null}
                            className="w-32 h-32 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-900 border-2 border-emerald-200 transition-all active:scale-90 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <span className="text-5xl mb-2">🍵</span>
                            <span className="font-bold text-xs">TEA</span>
                        </button>
                        <div className="text-emerald-800 font-bold bg-emerald-50 px-4 py-1 rounded-full text-sm border border-emerald-200">
                            Today: {teaCount}
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-50 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Sunrise</span>
                        <span className="font-bold text-gray-700 text-base">{formatTime(firstLog)}</span>
                    </div>
                    <div className="flex flex-col border-x border-gray-50 px-4">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Daily Cup Count</span>
                        <span className="font-black text-gray-900 text-2xl text-green-600 leading-none">{teaCount + coffeeCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Last Pour</span>
                        <span className="font-bold text-gray-700 text-base">{formatTime(lastLog)}</span>
                    </div>
                </div>
            </div>

            {/* Today's History (Log Deletion) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Today's History</h3>
                    <span className="text-[10px] font-bold text-gray-400 italic">Delete only available for today</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">No beverages logged today yet.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-xl">
                                        {log.beverage_type === 'TEA' ? '🍵' : '☕'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800">
                                            {log.beverage_type}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatTime(log.logged_at)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteLog(log.id)}
                                    disabled={deletingId === log.id}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
