import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

// Environment-based gate credentials
const GATE_USER = process.env.SITE_GATE_USER;
const GATE_PASS = process.env.SITE_GATE_PASS;
const AUTH_COOKIE = 'site_gate_auth';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  // Skip auth layer if credentials not configured
  if (!GATE_USER || !GATE_PASS) {
    return intlMiddleware(req);
  }

  const url = req.nextUrl;
  const pathname = url.pathname;

  // Ignore asset-like and health routes explicitly (defense in depth vs matcher)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/trpc') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    /.*\.[a-zA-Z0-9]{2,5}$/.test(pathname)
  ) {
    return intlMiddleware(req);
  }

  // Bypass if cookie present and valid
  const authCookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (authCookie === '1') {
    return intlMiddleware(req);
  }

  // Use HTTP Basic Auth challenge (works before any HTML), set cookie after success via rewrite response headers
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf8');
      const [user, pass] = decoded.split(':');
      if (user === GATE_USER && pass === GATE_PASS) {
        const res = intlMiddleware(req);
        // Mark authorization for subsequent requests (session length ~7 days)
        res.cookies.set(AUTH_COOKIE, '1', {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      }
    } catch {
      // fall through to challenge
    }
  }

  // Issue auth challenge (browser native prompt). Prevent indexing with noindex header fallback.
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Restricted Area"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  // Match all pathnames except for assets and system paths
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
