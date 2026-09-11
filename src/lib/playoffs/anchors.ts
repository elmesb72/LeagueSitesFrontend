// Stable in-page anchors linking the bracket to its series detail sections.
// Series numbers are unique only within a bracket, so the bracket name is part
// of every id.

import type { Bracket, Series } from '$lib/models/Playoffs';

export function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'bracket'
	);
}

export function bracketAnchor(bracket: Bracket): string {
	return `${slugify(bracket.name)}-bracket`;
}

export function seriesAnchor(bracket: Bracket, series: Series): string {
	return `${slugify(bracket.name)}-series-${series.number}`;
}
