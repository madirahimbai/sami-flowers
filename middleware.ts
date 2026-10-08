import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith('/admin/dashboard') || path.startsWith('/admin/availability')) {
    const value = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!(await verifySessionValue(value))) {
      const loginUrl = new URL('/admin', req.url);
      loginUrl.searchParams.set('next', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();
  // robots.txt disallows crawling here, but a disallow alone doesn't stop a
  // URL from being indexed if it's linked from elsewhere — this header is
  // the actual noindex signal for admin/API responses.
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
