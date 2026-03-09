import { NextRequest, NextResponse } from 'next/server';

const AUTH_PATHS = ['/login', '/register'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has('connect.sid');

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!isAuthPath && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
