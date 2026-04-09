export interface SiteHomeConfig {
	aboutBlurb: string;
	executives: Record<string, string>;
	socials: Record<string, string>;
	links: Record<string, string>;
	information: Record<string, string>;
}

export interface SiteConfig {
	siteName: string;
	shortName: string;
	home: SiteHomeConfig;
	apiKeys: {
		googleMaps: string;
	};
}
