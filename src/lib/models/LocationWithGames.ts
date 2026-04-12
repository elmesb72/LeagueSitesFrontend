import type { Game } from './Game';

export interface LocationWithGames {
	id: number;
	name: string;
	formalName: string | null;
	city: string;
	address: string | null;
	mapsPlaceId: string | null;
	recentGames: Game[];
	upcomingGames: Game[];
}
