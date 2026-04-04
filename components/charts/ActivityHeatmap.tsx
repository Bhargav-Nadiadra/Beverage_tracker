'use client';

interface ActivityData {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data: ActivityData[];
    daysToShow?: number;
    title?: string;
}

export function ActivityHeatmap({ data, daysToShow = 91, title = "Activity" }: ActivityHeatmapProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map data for quick lookup
    const dataMap = new Map<string, number>();
    data.forEach((d) => {
        const dateStr = new Date(d.date).toDateString();
        dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + d.count);
    });

    // Create array of days
    const days = Array.from({ length: daysToShow }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (daysToShow - 1 - i));
        return {
            date: d.toDateString(),
            displayDate: d.toLocaleDateString(),
            count: dataMap.get(d.toDateString()) || 0,
        };
    });

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
        if (count < 2) return 'bg-green-200 dark:bg-green-900/40 text-green-700';
        if (count < 4) return 'bg-green-400 dark:bg-green-700/60 text-white';
        if (count < 6) return 'bg-green-600 dark:bg-green-500 text-white';
        return 'bg-green-800 dark:bg-green-300 text-white dark:text-gray-900';
    };

    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">{title}</h3>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 font-medium">Last 90 Days</span>
            </div>
            <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="flex flex-wrap gap-1 min-w-[280px]">
                    {days.map((day) => (
                        <div
                            key={day.date}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] transition-all hover:ring-2 hover:ring-green-400 hover:ring-offset-1 dark:ring-offset-gray-950 cursor-help ${getColor(day.count)}`}
                            title={`${day.displayDate}: ${day.count} beverage(s)`}
                        />
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-400 font-medium">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[1px] bg-gray-100 dark:bg-gray-800"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-green-200 dark:bg-green-900/40"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-green-400 dark:bg-green-700/60"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-green-600 dark:bg-green-500"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-green-800 dark:bg-green-300"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
