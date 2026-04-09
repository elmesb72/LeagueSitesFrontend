import type { SiteUser } from "$lib/models/SiteUser";
import type { Team } from "$lib/models/Team";

export const load = async ({ fetch }) => {
  const logoPath = '/images/logo.webp';
    try {
      const [userResponse, teamsResponse, logoCheckResponse] = await Promise.all([
        fetch("http://localhost:5000/api/User"),
        fetch("http://localhost:5000/api/Teams"),
        fetch(logoPath, { method: 'HEAD' }),
      ]);
      if (!userResponse.ok || !teamsResponse.ok) {
        console.error("API responded with non-OK status", {
          userStatus: userResponse.status,
          teamsStatus: teamsResponse.status
        });
        return {
          user: { isAuthenticated: false, name: "", claims: [] } as SiteUser,
          teams: [] as Team[],
          logoExists: logoCheckResponse.ok,
        };
      }
      const user: SiteUser = await userResponse.json();
      if (user.claims) {
        user.claims = user.claims.filter((c) => c.type === "UserID");
      }
      const teams: Team[] = await teamsResponse.json();
      teams.sort((a, b) => a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase()));
      return { user, teams, logoExists: logoCheckResponse.ok };
    } catch {
      console.error("Failed to fetch data for layout load. Is the backend available?");
      return {
        user: { isAuthenticated: false, name: "", claims: [] } as SiteUser,
        teams: [] as Team[],
        logoExists: false,
      };
    }
  };