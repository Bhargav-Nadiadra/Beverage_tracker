'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, Droplets, Leaf, Settings2, Trash2, Check, AlertTriangle, Info } from 'lucide-react';

interface Log {
    id: string;
    beverage_type: 'TEA' | 'COFFEE' | 'WATER';
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
    is_decaf: boolean;
    logged_at: string;
}

interface BeverageLoggerProps {
    initialTeaCount: number;
    initialCoffeeCount: number;
    initialWaterCount: number;
    initialFirstLog: string | null;
    initialLastLog: string | null;
    todayLogs: Log[];
    dailyGoal: number | null;
    defaultBeverage: 'TEA' | 'COFFEE';
    notificationsEnabled: boolean;
}

export default function BeverageLogger({
    initialTeaCount,
    initialCoffeeCount,
    initialWaterCount,
    initialFirstLog,
    initialLastLog,
    todayLogs: serverLogs,
    dailyGoal,
    defaultBeverage,
    notificationsEnabled
}: BeverageLoggerProps) {
    const [teaCount, setTeaCount] = useState(initialTeaCount);
    const [coffeeCount, setCoffeeCount] = useState(initialCoffeeCount);
    const [waterCount, setWaterCount] = useState(initialWaterCount);
    const [firstLog, setFirstLog] = useState<string | null>(initialFirstLog);
    const [lastLog, setLastLog] = useState<string | null>(initialLastLog);
    const [logs, setLogs] = useState<Log[]>(serverLogs);
    const [loading, setLoading] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    // Advanced Options State
    const [selectedSize, setSelectedSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
    const [isDecaf, setIsDecaf] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const router = useRouter();

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const logBeverage = async (type: 'TEA' | 'COFFEE' | 'WATER') => {
        setLoading(type);

        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    beverageType: type,
                    size: selectedSize,
                    isDecaf: type === 'WATER' ? false : isDecaf // Water is always decaf lol
                }),
            });

            if (!response.ok) {
                alert('Failed to log beverage. Please try again.');
            } else {
                const data = await response.json();
                const newLog = {
                    id: data.log.id,
                    beverage_type: data.log.beverage_type,
                    size: data.log.size,
                    is_decaf: data.log.is_decaf,
                    logged_at: data.log.logged_at
                };

                // Update local state
                if (type === 'TEA') setTeaCount(prev => prev + 1);
                else if (type === 'COFFEE') setCoffeeCount(prev => prev + 1);
                else setWaterCount(prev => prev + 1);

                setLogs(prev => [newLog, ...prev]);

                if (!firstLog) setFirstLog(newLog.logged_at);
                setLastLog(newLog.logged_at);

                // Reset options after logging caffeine-free/water? 
                // Maybe keep them for next log.
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
                    else if (deletedLog.beverage_type === 'COFFEE') setCoffeeCount(prev => prev - 1);
                    else setWaterCount(prev => prev - 1);
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

    const caffeineTotal = teaCount + coffeeCount;

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
            {/* Quick Log and Options */}
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Coffee className="w-32 h-32" />
                </div>

                <div className="flex items-center justify-between w-full mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest leading-none">Log Fuel</h2>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2">Personal consumption tracker</p>
                    </div>
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-3 rounded-2xl transition-all ${showOptions ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-110' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Advanced Options Bar */}
                {showOptions && (
                    <div className="w-full mb-10 p-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800/50 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Serving Size</label>
                                <div className="flex gap-2">
                                    {['SMALL', 'MEDIUM', 'LARGE'].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size as any)}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${selectedSize === size ? 'bg-white dark:bg-gray-700 shadow-md text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content</label>
                                <button
                                    onClick={() => setIsDecaf(!isDecaf)}
                                    className={`w-full py-2 px-4 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${isDecaf ? 'bg-white dark:bg-gray-700 shadow-md text-amber-600 dark:text-amber-400' : 'bg-gray-100/50 dark:bg-gray-900/50 text-gray-400'}`}
                                >
                                    {isDecaf ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-700 rounded-full" />}
                                    DECAF VARIANT
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 justify-center w-full">
                    {/* Primary Beverage (from preference) */}
                    <div className={`flex flex-col items-center gap-4 group ${defaultBeverage === 'COFFEE' ? 'order-1' : 'order-1'}`}>
                        <button
                            onClick={() => logBeverage(defaultBeverage)}
                            disabled={loading !== null}
                            className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl disabled:opacity-50 relative group ${defaultBeverage === 'COFFEE' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100'}`}
                        >
                            <span className="text-4xl mb-2 group-hover:scale-125 transition-transform duration-300">
                                {defaultBeverage === 'COFFEE' ? '☕' : '🍵'}
                            </span>
                            <span className="font-black text-[10px] tracking-widest">{defaultBeverage}</span>
                            {isDecaf && <span className="absolute top-2 right-2 bg-white/80 dark:bg-black/60 px-1.5 py-0.5 rounded-lg text-[8px] font-black">DE</span>}
                        </button>
                        <div className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-500">
                            Count: {defaultBeverage === 'COFFEE' ? coffeeCount : teaCount}
                        </div>
                    </div>

                    {/* Secondary Beverage */}
                    <div className="flex flex-col items-center gap-4 group order-2">
                        <button
                            onClick={() => logBeverage(defaultBeverage === 'COFFEE' ? 'TEA' : 'COFFEE')}
                            disabled={loading !== null}
                            className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg opacity-80 hover:opacity-100 disabled:opacity-50 relative ${defaultBeverage === 'COFFEE' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'}`}
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                {defaultBeverage === 'COFFEE' ? '🍵' : '☕'}
                            </span>
                            <span className="font-black text-[10px] tracking-widest">{defaultBeverage === 'COFFEE' ? 'TEA' : 'COFFEE'}</span>
                            {isDecaf && <span className="absolute top-2 right-2 bg-white/80 dark:bg-black/60 px-1.5 py-0.5 rounded-lg text-[8px] font-black">DE</span>}
                        </button>
                        <div className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 text-gray-400">
                            Count: {defaultBeverage === 'COFFEE' ? teaCount : coffeeCount}
                        </div>
                    </div>

                    {/* Water Button (Always there) */}
                    <div className="flex flex-col items-center gap-4 group order-3">
                        <button
                            onClick={() => logBeverage('WATER')}
                            disabled={loading !== null}
                            className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 shadow-lg opacity-80 hover:opacity-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform"><Droplets className="w-10 h-10 text-blue-500" /></span>
                            <span className="font-black text-[10px] tracking-widest">WATER</span>
                        </button>
                        <div className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 text-blue-400/60">
                            Day Hydration: {waterCount}
                        </div>
                    </div>
                </div>

                {dailyGoal && (
                    <div className="w-full mt-10 p-6 bg-gray-50/50 dark:bg-gray-800/20 rounded-[32px] border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <span className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Caffeine Progress</span>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daily intake goal</p>
                            </div>
                            <span className={`text-base font-black ${caffeineTotal > dailyGoal ? 'text-red-500' : 'text-green-500'}`}>
                                {caffeineTotal} / {dailyGoal}
                            </span>
                        </div>
                        <div className="w-full bg-white dark:bg-gray-900 rounded-full h-4 shadow-inner overflow-hidden flex">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 shadow-sm ${caffeineTotal > dailyGoal ? 'bg-red-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
                                style={{ width: `${Math.min(100, (caffeineTotal / dailyGoal) * 100)}%` }}
                            ></div>
                        </div>
                        {caffeineTotal > dailyGoal && notificationsEnabled && (
                            <div className="mt-4 p-4 bg-red-100/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-red-600 dark:text-red-400">Limit Surpassed</span>
                                    <span className="text-[10px] font-bold text-red-500 dark:text-red-500/80 uppercase">Time to hydrate with water!</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-10 pt-8 border-t border-gray-50 dark:border-gray-800 w-full grid grid-cols-1 sm:grid-cols-3 gap-8 text-center px-4">
                    <div className="flex flex-col items-center">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Sunrise Pour</span>
                        <span className="font-black text-gray-800 dark:text-gray-200 text-sm tracking-widest">{formatTime(firstLog)}</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gray-100 dark:border-gray-800 px-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl mb-3">
                            <Leaf className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Total Cups</span>
                        <span className="font-black text-gray-950 dark:text-white text-3xl leading-none">{caffeineTotal}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">Sunset Log</span>
                        <span className="font-black text-gray-800 dark:text-gray-200 text-sm tracking-widest">{formatTime(lastLog)}</span>
                    </div>
                </div>
            </div>

            {/* Today's History */}
            <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/20 dark:bg-gray-800/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <Settings2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Recent Activity</h3>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Logs for today</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest">No fuel detected</p>
                            <p className="text-[10px] text-gray-300 uppercase mt-2 font-bold tracking-widest">Start logging to see history</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-gray-100 dark:border-gray-800 ${log.beverage_type === 'TEA' ? 'bg-emerald-50 dark:bg-emerald-900/20' : log.beverage_type === 'COFFEE' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                        {log.beverage_type === 'TEA' ? '🍵' : log.beverage_type === 'COFFEE' ? '☕' : '💧'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">{log.beverage_type}</span>
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[8px] font-black text-gray-400 uppercase tracking-widest">{log.size}</span>
                                            {log.is_decaf && <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded text-[8px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">DECAF</span>}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1">
                                            Recorded at {formatTime(log.logged_at)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteLog(log.id)}
                                    disabled={deletingId === log.id}
                                    className="p-3 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-2xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
