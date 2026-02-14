import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/tools", "/dashboard", "/onboarding"];
const SESSION_COOKIE = "salybgone_session";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (!payload.email) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const isOnboarding = pathname === "/onboarding";
    const userHasProfile = payload.hasProfile === true;

    // User on /dashboard or /tools without a profile → send to onboarding first
    if (!isOnboarding && !userHasProfile) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // /onboarding is always accessible (new profile or editing existing)

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/tools/:path*", "/dashboard/:path*", "/onboarding"],
};
