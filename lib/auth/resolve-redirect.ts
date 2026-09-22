const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];

export function resolveAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
  hasStore: boolean | null
): string | null {
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
