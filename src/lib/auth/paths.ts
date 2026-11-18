/** Rotas acessíveis sem sessão. */
const PUBLIC_PATHS = ["/login", "/esqueci-senha"];
const PUBLIC_PREFIXES = ["/auth/"];

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Aceita apenas caminhos relativos internos, evitando open redirect
 * (ex.: "//evil.com" ou "https://evil.com").
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
