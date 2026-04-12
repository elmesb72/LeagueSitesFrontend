import type { Team } from './Team';

export interface UserLoginEntry {
	id: number;
	name: string;
	email: string;
	isPrimary: boolean;
	loginSource: { id: number; source: string } | null;
}

export interface UserInvitation {
	id: number;
	team: Team | null;
	player: {
		id: number;
		name: string;
		shortCode: string;
	} | null;
	status: { name: string } | null;
	invitationRoles: { role: { name: string } | null }[];
}

export interface UserProfile {
	id: number;
	userLogins: UserLoginEntry[];
	userRoles: { role: { name: string } | null }[];
	invitations: UserInvitation[];
}

export interface UserProfileData {
	user: UserProfile;
	hasDeletedNews: boolean;
}
