import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin/dashboard')) {
    const value = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!(await verifySessionValue(value))) {
      const loginUrl = new URL('/admin', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};
