export function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
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
	const d = new Date(dateStr + 'T12:00:00');
	return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function toDateKey(dateStr: string): string {
	return new Date(dateStr).toISOString().split('T')[0];
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
