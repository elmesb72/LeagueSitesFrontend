import type { SiteUserClaim } from "./SiteUserClaim";

export interface SiteUser {
    isAuthenticated: boolean;
    name: string;
    claims?: SiteUserClaim[];
}