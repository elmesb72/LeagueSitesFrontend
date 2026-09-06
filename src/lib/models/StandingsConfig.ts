/** League standings rules, as served by /api/Site/Config/Edit. */
export interface StandingsConfigEdit {
	winsValue: number;
	tiesValue: number;
	lossesValue: number;
	forfeitWinnerScore: number;
	forfeitLoserScore: number;
	/** Ordered comparator names; team name is always the implicit final fallback. */
	tiebreakers: string[];
}

/** One selectable ranking rule from the backend comparator registry. */
export interface StandingsComparatorOption {
	name: string;
	description: string;
	/** True when the metric is computed only among the tied teams (head-to-head). */
	groupRestricted: boolean;
}

export function defaultStandingsConfig(): StandingsConfigEdit {
	return {
		winsValue: 2,
		tiesValue: 1,
		lossesValue: 0,
		forfeitWinnerScore: 7,
		forfeitLoserScore: 0,
		tiebreakers: ['Points', 'Wins', 'RunDifferential']
	};
}

/**
 * Client-side mirror of the server's StandingsConfigService.Validate, for
 * immediate feedback. The server remains authoritative.
 */
export function validateStandingsConfig(config: StandingsConfigEdit): string[] {
	const problems: string[] = [];

	const pointFields: [number, string][] = [
		[config.winsValue, 'Win points'],
		[config.tiesValue, 'Tie points'],
		[config.lossesValue, 'Loss points']
	];
	for (const [value, label] of pointFields) {
		if (!Number.isInteger(value) || value < -100 || value > 100) {
			problems.push(`${label} must be a whole number between -100 and 100.`);
		}
	}

	const forfeitFields: [number, string][] = [
		[config.forfeitWinnerScore, 'The forfeit winner score'],
		[config.forfeitLoserScore, 'The forfeit loser score']
	];
	for (const [value, label] of forfeitFields) {
		if (!Number.isInteger(value) || value < 0 || value > 99) {
			problems.push(`${label} must be a whole number between 0 and 99.`);
		}
	}

	if (config.forfeitWinnerScore <= config.forfeitLoserScore) {
		problems.push('The forfeit winner score must be higher than the loser score.');
	}

	if (config.tiebreakers.length === 0) {
		problems.push('At least one tiebreaker is required.');
	}

	return problems;
}
