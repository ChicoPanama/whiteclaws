import { PrivyClient } from "@privy-io/server-auth";

const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID || "",
  process.env.PRIVY_APP_SECRET || ""
);

export { privyClient };

export async function verifyPrivyToken(token: string) {
  try {
    const verified = await privyClient.verifyAuthToken(token);
    return verified;
  } catch (error) {
    console.error("Privy token verification failed:", error);
    return null;
  }
}

export async function getUser(userId: string) {
  try {
    const user = await privyClient.getUser(userId);
    return user;
  } catch (error) {
    console.error("Failed to get Privy user:", error);
    return null;
  }
}
