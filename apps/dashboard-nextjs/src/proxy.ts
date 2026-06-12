import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/logout"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  // Demo mode: no auth, no session refresh. If a visitor lands on /login
  // bounce them straight to /inbox so they don't get a useless magic-link form.
  if (isDemoMode()) {
    const { pathname } = request.nextUrl;
    if (pathname === "/" || pathname === "/login") {
      return NextResponse.redirect(new URL("/inbox", request.url));
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Run on every path except static assets and Next internals so the session cookie
  // stays refreshed across navigations.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
