import "server-only";
import { createAuth } from "./auth-config";

let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  auth ??= createAuth();
  return auth;
}
