'use client';

interface PeakHourData {
    day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
    hour: number;        // 0-23
    count: number;
}

interface PeakHourHeatmapProps {
    data: PeakHourData[];
    title?: string;
}

export function PeakHourHeatmap({ data, title = "Peak Usage Hours" }: PeakHourHeatmapProps) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    
    // Sort Mon-Sun instead of Sun-Sat (standard in many regions)
    const displayDaysOrder = [1, 2, 3, 4, 5, 6, 0];
    
    // Find max to scale colors
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    // Create matrix for easy lookup [day][hour]
    const matrix: Record<number, Record<number, number>> = {};
    data.forEach(d => {
        if (!matrix[d.day_of_week]) matrix[d.day_of_week] = {};
        matrix[d.day_of_week][d.hour] = d.count;
    });

    const getIntensityStyle = (count: number) => {
        if (!count) return 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800';
        const intensity = count / maxCount;
        
        if (intensity <= 0.25) return 'bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-900/50';
        if (intensity <= 0.5) return 'bg-green-300 dark:bg-green-800 border-green-400 dark:border-green-700/50';
        if (intensity <= 0.75) return 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500/50';
        return 'bg-green-700 dark:bg-green-400 border-green-800 dark:border-green-300';
    };

    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Darker squares represent higher beverage consumption</p>
            </div>
            
            <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Header: Hours */}
                    <div className="flex mb-1">
                        <div className="w-10 flex-shrink-0" />
                        <div className="flex-1 flex justify-between px-1">
                            {hours.filter(h => h % 3 === 0).map(h => (
                                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter w-full text-center">
                                    {h}:00
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {/* Rows: Days */}
                    {displayDaysOrder.map(dayIdx => (
                        <div key={dayIdx} className="flex items-center mb-1 group">
                            <div className="w-10 flex-shrink-0 text-[10px] font-bold text-gray-400 uppercase">
                                {days[dayIdx]}
                            </div>
                            <div className="flex-1 flex gap-0.5 sm:gap-1">
                                {hours.map(hour => {
                                    const count = matrix[dayIdx]?.[hour] || 0;
                                    return (
                                        <div
                                            key={hour}
                                            className={`flex-1 h-6 sm:h-8 rounded-[2px] border transition-all duration-300 hover:z-10 hover:scale-110 hover:shadow-lg cursor-help ${getIntensityStyle(count)}`}
                                            title={`${days[dayIdx]} ${hour}:00: ${count} logs`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    
                    {/* Footer: Legend */}
                    <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700"></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">None</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-green-700 dark:text-green-500 uppercase tracking-widest">Intensity</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-green-100 dark:bg-green-950 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-300 dark:bg-green-800 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-700 dark:bg-green-400 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
