export function calculateStreaks(dates: Date[]) {
    if (!dates || dates.length === 0) return { current: 0, longest: 0 };
    
    // Normalize dates to midnight to easily compare days
    const normalizeDate = (d: Date) => {
        const nd = new Date(d);
        nd.setUTCHours(0, 0, 0, 0);
        return nd;
    };
    
    // Remove duplicates and sort descending
    const uniqueDates = Array.from(new Set(dates.map(d => normalizeDate(d).getTime()))).sort((a, b) => b - a);
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let previousTime: number | null = null;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    // Calculate max streak
    const ascendingDates = [...uniqueDates].reverse();
    for (let i = 0; i < ascendingDates.length; i++) {
        const time = ascendingDates[i];
        if (previousTime === null) {
            tempStreak = 1;
        } else {
            const diff = time - previousTime;
            if (diff <= ONE_DAY + 1000) { 
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }
        if (tempStreak > maxStreak) {
            maxStreak = tempStreak;
        }
        previousTime = time;
    }
    
    // Calculate current streak
    const today = normalizeDate(new Date()).getTime();
    
    if (uniqueDates.length > 0) {
        const lastLog = uniqueDates[0];
        if (lastLog === today || lastLog === today - ONE_DAY) {
            currentStreak = 1;
            let expectedDate = lastLog;
            for (let i = 1; i < uniqueDates.length; i++) {
                if (uniqueDates[i] === expectedDate - ONE_DAY) {
                    currentStreak++;
                    expectedDate -= ONE_DAY;
                } else {
                    break;
                }
            }
        }
    }

    return { current: currentStreak, longest: maxStreak };
}
