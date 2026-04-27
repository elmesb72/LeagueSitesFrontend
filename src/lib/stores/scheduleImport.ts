import { writable } from 'svelte/store';

export interface ImportGameRow {
	rowNumber: number;
	dateRaw: string;
	timeRaw: string;
	hostRaw: string;
	visitorRaw: string;
	locationRaw: string;
	date: string | null;
	hostTeamID: number | null;
	hostTeamName: string | null;
	visitingTeamID: number | null;
	visitingTeamName: string | null;
	locationID: number | null;
	locationName: string | null;
	warnings: string[];
}

export interface ImportPreview {
	seasonID: number;
	totalRows: number;
	validRows: number;
	invalidRows: number;
	games: ImportGameRow[];
	matchupMatrix: Record<string, Record<string, number>>;
	globalWarnings: string[];
}

export const scheduleImportPreview = writable<ImportPreview | null>(null);
