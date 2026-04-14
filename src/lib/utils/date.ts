/**
 * Extracts the date portion (YYYY-MM-DD) directly from an ISO date string
 * without going through Date object parsing, avoiding timezone shifts.
 */
export function toDateKey(dateStr: string): string {
	return dateStr.split('T')[0];
}

export function formatDate(dateStr: string): string {
	const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
	return d.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

export function formatTime(dateStr: string): string {
	return new Date(dateStr).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function formatDateLabel(dateStr: string): string {
	const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
	return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function groupByDate<T>(items: T[], getDate: (item: T) => string): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const key = toDateKey(getDate(item));
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(item);
	}
	return groups;
}

/**
 * Adds days to a YYYY-MM-DD date string, returning a new YYYY-MM-DD string.
 * Uses noon to avoid DST edge cases.
 */
export function addDays(dateStr: string, days: number): string {
	const d = new Date(dateStr + 'T12:00:00');
	d.setDate(d.getDate() + days);
	return d.toISOString().split('T')[0];
}

/**
 * Returns the day of week (0=Sun, 6=Sat) for a YYYY-MM-DD date string.
 */
export function getDayOfWeek(dateStr: string): number {
	return new Date(dateStr + 'T12:00:00').getDay();
}
