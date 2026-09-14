/** The kinds a season can be; `subseason` holds one of these. */
export type SeasonKind = 'Regular Season' | 'Playoffs' | 'Tournament';

export interface Season {
	id: number;
	year: number;
	subseason: SeasonKind | string;
	/**
	 * The stored display name: "2026 Regular Season", "2026 Playoffs",
	 * "2027 Canada Day Cup". Regular seasons and playoffs are always named by
	 * the site; a tournament's name is what the executive typed with the year
	 * put in front.
	 */
	name: string;
	startDate: string;
}
