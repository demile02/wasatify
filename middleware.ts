import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { AppRole } from '@/lib/types';

const protectedRoutes = [
  { prefix: '/student', role: 'student' as AppRole },
  { prefix: '/teacher', role: 'teacher' as AppRole },
];

const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchedProtectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.prefix));

  if (!user && matchedProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  const role = await getUserRole(supabase, user.id);

  if (matchedProtectedRoute && !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (matchedProtectedRoute && role && !canAccessRoute(role, matchedProtectedRoute.role)) {
    return NextResponse.redirect(new URL(getRoleDashboardPath(role), request.url));
  }

  const isConfirmedLogin = pathname === '/login' && request.nextUrl.searchParams.get('confirmed') === '1';

  if (authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && role && !isConfirmedLogin) {
    return NextResponse.redirect(new URL(getRoleDashboardPath(role), request.url));
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

function canAccessRoute(role: AppRole, requiredRole: AppRole) {
  if (requiredRole === 'student') return role === 'student';
  if (requiredRole === 'teacher') return role === 'teacher' || role === 'admin';
  return role === requiredRole;
}

function getRoleDashboardPath(role: AppRole) {
  if (role === 'student') return '/student/dashboard';
  return '/teacher/dashboard';
}

export const config = {
  matcher: ['/login', '/register/:path*', '/forgot-password', '/student/:path*', '/teacher/:path*'],
};
