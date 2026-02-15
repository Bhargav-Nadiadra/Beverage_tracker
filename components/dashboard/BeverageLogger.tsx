'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BeverageLoggerProps {
    initialTeaCount: number;
    initialCoffeeCount: number;
    initialFirstLog: string | null;
    initialLastLog: string | null;
}

export default function BeverageLogger({ initialTeaCount, initialCoffeeCount, initialFirstLog, initialLastLog }: BeverageLoggerProps) {
    const [teaCount, setTeaCount] = useState(initialTeaCount);
    const [coffeeCount, setCoffeeCount] = useState(initialCoffeeCount);
    const [firstLog, setFirstLog] = useState<string | null>(initialFirstLog);
    const [lastLog, setLastLog] = useState<string | null>(initialLastLog);
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const logBeverage = async (type: 'TEA' | 'COFFEE') => {
        setLoading(type);

        const now = new Date().toISOString();

        // Optimistic update
        if (type === 'TEA') setTeaCount(prev => prev + 1);
        else setCoffeeCount(prev => prev + 1);

        // Update timestamps optimistically
        if (!firstLog) setFirstLog(now);
        setLastLog(now);

        try {
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ beverageType: type }),
            });

            if (!response.ok) {
                // Revert on error
                if (type === 'TEA') setTeaCount(prev => prev - 1);
                else setCoffeeCount(prev => prev - 1);
                // Note: Reverting timestamps is complex, we'll rely on router.refresh() or keep inaccurate state momentarily
                alert('Failed to log beverage. Please try again.');
            } else {
                router.refresh();
            }
        } catch (error) {
            // Revert on error
            if (type === 'TEA') setTeaCount(prev => prev - 1);
            else setCoffeeCount(prev => prev - 1);
            console.error(error);
            alert('An error occurred.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-100 w-full max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Quick Log</h2>

            <div className="flex flex-wrap gap-8 justify-center w-full">
                {/* Coffee Button */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => logBeverage('COFFEE')}
                        disabled={loading !== null}
                        className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border-2 border-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 group shadow-sm hover:shadow-md"
                        aria-label="Log Coffee"
                    >
                        <span className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-200 ease-out">☕</span>
                        <span className="font-bold text-amber-800 tracking-wide">COFFEE</span>
                    </button>
                    <div className="text-gray-600 font-medium bg-amber-50 px-4 py-1.5 rounded-full text-sm border border-amber-100 flex items-center gap-2">
                        Today: <span className="font-bold text-amber-700 text-lg leading-none">{coffeeCount}</span>
                    </div>
                </div>

                {/* Tea Button */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => logBeverage('TEA')}
                        disabled={loading !== null}
                        className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-900 border-2 border-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 group shadow-sm hover:shadow-md"
                        aria-label="Log Tea"
                    >
                        <span className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-200 ease-out">🍵</span>
                        <span className="font-bold text-emerald-800 tracking-wide">TEA</span>
                    </button>
                    <div className="text-gray-600 font-medium bg-emerald-50 px-4 py-1.5 rounded-full text-sm border border-emerald-100 flex items-center gap-2">
                        Today: <span className="font-bold text-emerald-700 text-lg leading-none">{teaCount}</span>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm text-gray-500">
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">First Cup</span>
                    <span className="font-bold text-gray-800 text-lg">{formatTime(firstLog)}</span>
                </div>
                <div className="flex flex-col border-x border-gray-100">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Total Cups</span>
                    <span className="font-bold text-gray-900 text-2xl text-green-600">{teaCount + coffeeCount}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">Last Cup</span>
                    <span className="font-bold text-gray-800 text-lg">{formatTime(lastLog)}</span>
                </div>
            </div>
        </div>
    );
}
