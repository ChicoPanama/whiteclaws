import { PrivyClient } from "@privy-io/server-auth";

// Server-side Privy client for token verification and user lookup.
// Requires PRIVY_APP_ID and PRIVY_APP_SECRET set in environment.

const appId = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
const appSecret = process.env.PRIVY_APP_SECRET || "";

const privyClient = appId && appSecret
  ? new PrivyClient(appId, appSecret)
  : null;

export { privyClient };

export async function verifyPrivyToken(token: string) {
  if (!privyClient) {
    console.warn("[Privy] Server client not configured (missing PRIVY_APP_ID or PRIVY_APP_SECRET)");
    return null;
  }
  try {
    return await privyClient.verifyAuthToken(token);
  } catch (error) {
    console.error("Privy token verification failed:", error);
    return null;
  }
}

export async function getUser(userId: string) {
  if (!privyClient) {
    console.warn("[Privy] Server client not configured");
    return null;
  }
  try {
    return await privyClient.getUser(userId);
  } catch (error) {
    console.error("Failed to get Privy user:", error);
    return null;
  }
}
