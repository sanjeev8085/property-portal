import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin";
const LOGIN_PAGE = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard admin routes
  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next();
  }

  // Always allow the login page through
  if (pathname === LOGIN_PAGE || pathname.startsWith(`${LOGIN_PAGE}/`)) {
    return NextResponse.next();
  }

  // Check for token in cookies (set by the login handler)
  const token = request.cookies.get("admin_token")?.value;
  const userType = request.cookies.get("user_type")?.value;

  if (!token || userType !== "admin") {
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all /admin/* routes, skip static assets
  matcher: ["/admin/:path*"],
};
