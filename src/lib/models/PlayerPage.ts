import type { Team } from './Team';

export interface PlayerBio {
	bats: string | null;
	throws: string | null;
	positions: string | null;
	height: number | null;
	heightImperial: number | null;
	weight: number | null;
	weightImperial: number | null;
	birthdate: string | null;
	from: string | null;
	referredBy: string | null;
}

export interface PlayerSocial {
	account: string;
	platform: { name: string } | null;
}

export interface PlayerInvitation {
	team: Team | null;
	status: { name: string } | null;
}

export interface PlayerDetail {
	id: number;
	firstName: string;
	lastName: string;
	name: string;
	number: string | null;
	shortCode: string;
	bio: PlayerBio | null;
	invitations: PlayerInvitation[];
	socials: PlayerSocial[];
}

export interface PlayerPageData {
	player: PlayerDetail;
	referredBy: { id: number; name: string; shortCode: string } | null;
}
