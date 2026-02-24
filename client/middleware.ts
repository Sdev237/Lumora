/**
 * Next.js Middleware
 * Handle route protection and redirects
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // You can add authentication checks here if needed
  // For now, we handle auth in components using AuthContext
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
