import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/protocols/submit',
  '/protocols/*/submit',
];

// Define admin routes
const adminRoutes = [
  '/admin',
  '/admin/*',
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('*')) {
      const regex = new RegExp('^' + route.replace('*', '.*'));
      return regex.test(request.nextUrl.pathname);
    }
    return request.nextUrl.pathname.startsWith(route);
  });

  // If protected route and no session, redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some(route => {
    if (route.includes('*')) {
      const regex = new RegExp('^' + route.replace('*', '.*'));
      return regex.test(request.nextUrl.pathname);
    }
    return request.nextUrl.pathname.startsWith(route);
  });

  if (isAdminRoute) {
    // For now, just check if user is authenticated
    // In production, check admin role
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/protocols/:path*/submit',
    '/admin/:path*',
  ],
};
