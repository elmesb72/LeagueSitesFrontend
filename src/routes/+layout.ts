import type { SiteUser } from "$lib/models/SiteUser";
import type { SiteConfig } from "$lib/models/SiteConfig";
import type { Team } from "$lib/models/Team";

const defaultSiteConfig: SiteConfig = {
  siteName: 'League Site',
  shortName: '',
  home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} },
  apiKeys: { googleMaps: '' }
};

export const load = async ({ fetch }) => {
    try {
      const [userResponse, teamsResponse, siteConfigResponse] = await Promise.all([
        fetch('/api/User'),
        fetch('/api/Teams'),
        fetch('/api/Site/Config'),
      ]);

      const siteConfig: SiteConfig = siteConfigResponse.ok
        ? await siteConfigResponse.json()
        : defaultSiteConfig;

      const user: SiteUser = userResponse.ok
        ? await userResponse.json()
        : { isAuthenticated: false, name: "", claims: [] };

      if (!teamsResponse.ok) {
        console.error("Teams API responded with non-OK status", teamsResponse.status);
        return {
          user,
          teams: [] as Team[],
          siteConfig,
        };
      }
      if (user.claims) {
        user.claims = user.claims.filter((c) => c.type === "UserID");
      }
      const teams: Team[] = await teamsResponse.json();
      teams.sort((a, b) => a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase()));
      return { user, teams, siteConfig };
    } catch {
      console.error("Failed to fetch data for layout load. Is the backend available?");
      return {
        user: { isAuthenticated: false, name: "", claims: [] } as SiteUser,
        teams: [] as Team[],
        siteConfig: defaultSiteConfig,
      };
    }
  };
