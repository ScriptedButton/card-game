"use server";

import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnGamePage = req.nextUrl.pathname.startsWith("/game");
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/api/auth");
  const isGuestAccess = req.nextUrl.searchParams.has("guest");

  // Allow access to auth-related pages
  if (isOnAuthPage) {
    return NextResponse.next();
  }

  // Allow access to game page for guests with the guest parameter or for logged-in users
  if (isOnGamePage && !isLoggedIn && !isGuestAccess) {
    return Response.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

// Optionally configure which paths to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
