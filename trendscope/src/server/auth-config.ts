import { betterAuth } from "better-auth";

import { getDB } from "./db";

export function authConfigured(): boolean {
  const secret = process.env.BETTER_AUTH_SECRET;
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_URL && secret && secret.length >= 32);
}
export function providerConfigured(provider: "google" | "tiktok"): boolean {
  return (
    authConfigured() &&
    (provider === "google"
      ? Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      : Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET))
  );
}
export function createAuth() {
  if (!authConfigured()) throw new Error("Autenticação não configurada");
  return betterAuth({
    appName: "TrendScope",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: getDB(),
    emailAndPassword: { enabled: false },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: true,
        trustedProviders: ["google", "tiktok"],
      },
    },
    socialProviders: {
      ...(providerConfigured("google")
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID as string,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
              accessType: "offline" as const,
              prompt: "select_account consent" as const,
              scope: ["https://www.googleapis.com/auth/youtube.readonly"],
            },
          }
        : {}),
      ...(providerConfigured("tiktok")
        ? {
            tiktok: {
              clientKey: process.env.TIKTOK_CLIENT_KEY as string,
              clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
              scope: ["user.info.basic", "user.info.profile", "user.info.stats", "video.list"],
            },
          }
        : {}),
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 50 },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  });
}
