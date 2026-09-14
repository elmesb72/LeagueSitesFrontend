export interface HistoryYear {
	calendarYear: number;
	exceptionYearDescription: string | null;
	/** Every title of the year, comma-joined: the playoffs champion, then "Canada Day Cup: Team". */
	champion: string | null;
	championAbbreviation: string | null;
	bestRecord: string | null;
	bestRecordAbbreviation: string | null;
	bestRecordResults: string | null;
	playoffsComplete: boolean;
	regularSeasonComplete: boolean;
	/** The year's mid-season tournaments, decided or not, for their links. */
	tournaments?: HistoryTournament[];
}

export interface HistoryTournament {
	id: number;
	/** "2027 Canada Day Cup" */
	name: string;
	/** "Canada Day Cup" — the name without its year */
	shortName: string;
	decided: boolean;
}
