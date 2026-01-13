export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Use NEXT_PUBLIC_ prefix for Next.js environment variables
  const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL;
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  
  // Return fallback if env vars not configured
  if (!oauthPortalUrl || !appId) {
    console.warn("OAuth not configured: NEXT_PUBLIC_OAUTH_PORTAL_URL or NEXT_PUBLIC_APP_ID missing");
    return "/login";
  }
  
  const redirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/oauth/callback`
    : '';
  const state = typeof window !== 'undefined' ? btoa(redirectUri) : '';

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
