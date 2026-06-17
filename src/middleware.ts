import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";
const SECRET = process.env.ADMIN_SECRET ?? "";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // ?key=... → set cookie and redirect clean
  const key = searchParams.get("key");
  if (key) {
    if (key === SECRET && SECRET !== "") {
      const url = req.nextUrl.clone();
      url.searchParams.delete("key");
      const res = NextResponse.redirect(url);
      res.cookies.set(COOKIE, SECRET, {
        httpOnly: true,
        sameSite: "lax",
        // No maxAge = session cookie (until browser closes)
        // Add maxAge: 60 * 60 * 24 * 30 to keep for 30 days
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return res;
    }
    // Wrong key → 404
    return new NextResponse(null, { status: 404 });
  }

  // Check cookie
  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie === SECRET && SECRET !== "") {
    return NextResponse.next();
  }

  // No cookie, no key → 404
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: "/admin/:path*",
};
