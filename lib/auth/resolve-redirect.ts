const PUBLIC_PATHS = ["/login", "/signup", "/recuperar-senha"];
// The reset link lands on /auth/callback signed out, which signs in and continues to /redefinir-senha.
const ANY_SESSION_PATHS = ["/redefinir-senha", "/auth/callback"];

export function resolveAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
  hasStore: boolean | null
): string | null {
  if (ANY_SESSION_PATHS.some((path) => pathname.startsWith(path))) return null;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!isAuthenticated) {
    return isPublicPath ? null : "/login";
  }

  if (isPublicPath) {
    return hasStore ? "/dashboard" : "/onboarding";
  }

  if (pathname.startsWith("/onboarding")) {
    return hasStore ? "/dashboard" : null;
  }

  if (hasStore === false) {
    return "/onboarding";
  }

  return null;
}
