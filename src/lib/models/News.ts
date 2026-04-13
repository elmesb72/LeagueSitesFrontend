export interface NewsAuthor {
	id: number;
	name: string;
}

export interface News {
	id: number;
	title: string;
	contents: string;
	date: string;
	edited: string | null;
	isHidden: boolean;
	authorId: number;
	authorInvitationID: number;
	author: NewsAuthor;
}
