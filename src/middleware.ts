import { withAuth } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const kindeMiddleware = withAuth({
  loginPage: '/sign-in',
}) as (request: NextRequest) => Promise<NextResponse | undefined>;

const sessionCookieNames = [
  'access_token',
  'access_token_payload',
  'id_token',
  'id_token_payload',
  'refresh_token',
  'user',
];

function jwtCanBeDecoded(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    for (const part of parts.slice(0, 2)) {
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(paddedBase64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      JSON.parse(new TextDecoder().decode(bytes));
    }

    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth-callback'],
};

export default async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');

  if (accessToken && !jwtCanBeDecoded(accessToken.value)) {
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    const cookieDomain = process.env.KINDE_COOKIE_DOMAIN;

    for (const name of sessionCookieNames) {
      response.cookies.set(name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
    }

    return response;
  }

  return kindeMiddleware(request);
}
