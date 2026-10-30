import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { AppRole } from '@/lib/types';

const protectedRoutes = [
  { prefix: '/student', role: 'student' as AppRole },
  { prefix: '/teacher', role: 'teacher' as AppRole },
];

const authRoutes = ['/login', '/register', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const previousCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchedProtectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.prefix));

  function redirect(url: URL) {
    const redirected = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  if (!user && matchedProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  // Protected layouts and server actions enforce roles. Avoid a second profile query here.
  if (matchedProtectedRoute) return response;

  const onboardingRoutes = ['/register/confirmation', '/register/student/complete', '/register/teacher/complete'];
  if (onboardingRoutes.includes(pathname)) return response;

  const isConfirmedLogin = pathname === '/login' && request.nextUrl.searchParams.get('confirmed') === '1';

  if (authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !isConfirmedLogin) {
    const role = await getUserRole(supabase, user.id);
    if (role) return redirect(new URL(getRoleDashboardPath(role), request.url));
  }

  return response;
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<AppRole | null> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  const role = data?.role;

  if (role === 'student' || role === 'teacher' || role === 'admin') {
    return role;
  }

  return null;
}

function getRoleDashboardPath(role: AppRole) {
  if (role === 'student') return '/student/dashboard';
  return '/teacher/dashboard';
}

export const config = {
  matcher: ['/login', '/register/:path*', '/forgot-password', '/reset-password', '/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
