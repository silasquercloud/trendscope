export function sameOrigin(request: Request): boolean {
  try {
    return Boolean(
      process.env.BETTER_AUTH_URL && request.headers.get("origin") === new URL(process.env.BETTER_AUTH_URL).origin,
    );
  } catch {
    return false;
  }
}
