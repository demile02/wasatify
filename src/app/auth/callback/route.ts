import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getRoleDashboardPath, isAppRole } from '@/lib/auth/roles';
import { siteUrl } from '@/lib/site';
import type { AppRole } from '@/lib/types';

const trustedOrigins = new Set([
  siteUrl,
  'https://wasatify.demile.my.id',
  'http://213.163.193.255',
  'http://localhost:3100',
  'http://localhost:3000',
  'http://127.0.0.1:3100',
  'http://127.0.0.1:3000',
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getRequestOrigin(request, requestUrl);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));
  const isPasswordRecovery = next === '/reset-password';

  if (requestUrl.searchParams.has('error') || requestUrl.searchParams.has('error_description')) {
    if (isPasswordRecovery) return redirectToForgotPassword(origin, 'expired');
    return redirectToLogin(origin, 'google');
  }

  if (code && isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return isPasswordRecovery
          ? redirectToForgotPassword(origin, 'expired')
          : redirectToLogin(origin, 'google');
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        if (isPasswordRecovery) return redirectToForgotPassword(origin, 'expired');
        return redirectToLogin(origin, 'profile');
      }

      if (isPasswordRecovery) {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user.id)
        .maybeSingle<{ role: string; class_id: string | null }>();

      if (profileError || !profile || !isAppRole(profile.role)) {
        await supabase.auth.signOut();
        return redirectToLogin(origin, 'profile');
      }

      const isIncompleteStudent = profile.role === 'student' && !profile.class_id;
      const registrationRole = getGoogleRegistrationRole(next, user.app_metadata.provider);
      if (next && isEmailConfirmationPath(next)) {
        return NextResponse.redirect(new URL(next, origin));
      }

      if (isIncompleteStudent && registrationRole) {
        const confirmationUrl = new URL('/register/confirmation', origin);
        confirmationUrl.searchParams.set('method', 'google');
        confirmationUrl.searchParams.set('role', registrationRole);
        return NextResponse.redirect(confirmationUrl);
      }

      const destination = isIncompleteStudent
        ? registrationRole === 'teacher'
          ? '/register/teacher/complete'
          : '/register/student/complete'
        : next && canUseNextPath(next, profile.role)
          ? next
          : getRoleDashboardPath(profile.role);

      return NextResponse.redirect(new URL(destination, origin));
    } catch {
      if (isPasswordRecovery) return redirectToForgotPassword(origin, 'send');
      return redirectToLogin(origin, 'google');
    }
  }

  if (isPasswordRecovery) return redirectToForgotPassword(origin, 'expired');
  return NextResponse.redirect(new URL(next ?? '/login?confirmed=1', origin));
}

function getRequestOrigin(request: NextRequest, requestUrl: URL) {
  const forwardedHosts = request.headers.get('x-forwarded-host')?.split(',') ?? [];
  const hosts = [...forwardedHosts, request.headers.get('host') ?? '']
    .map((host) => host.trim())
    .filter(Boolean);
  const forwardedProtocols = request.headers.get('x-forwarded-proto')?.split(',') ?? [];
  const protocols = [...forwardedProtocols, requestUrl.protocol.slice(0, -1)]
    .map((protocol) => protocol.trim().toLowerCase())
    .filter((protocol) => protocol === 'http' || protocol === 'https');

  for (const host of hosts) {
    for (const protocol of protocols) {
      try {
        const origin = new URL(`${protocol}://${host}`).origin;
        if (trustedOrigins.has(origin)) return origin;
      } catch {
      }
    }
  }

  return siteUrl;
}

function getGoogleRegistrationRole(next: string | null, provider: string | undefined) {
  if (provider !== 'google') return null;
  if (next === '/register/teacher/complete') return 'teacher' as const;
  if (next === '/register/student/complete') return 'student' as const;
  return null;
}

function isEmailConfirmationPath(next: string | null) {
  if (!next) return false;
  const destination = new URL(next, 'https://wasatify.invalid');
  return destination.pathname === '/register/confirmation'
    && destination.searchParams.get('method') === 'email'
    && destination.searchParams.get('confirmed') === '1';
}

function canUseNextPath(path: string, role: AppRole) {
  if (path.startsWith('/login')) return false;

  const pathname = new URL(path, 'https://wasatify.invalid').pathname;
  if (pathname === '/student' || pathname.startsWith('/student/')) return role === 'student';
  if (pathname === '/teacher' || pathname.startsWith('/teacher/')) return role === 'teacher' || role === 'admin';

  return true;
}

function redirectToLogin(origin: string, error: 'google' | 'profile') {
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('oauth_error', error);
  return NextResponse.redirect(loginUrl);
}

function redirectToForgotPassword(origin: string, error: 'expired' | 'send') {
  const forgotPasswordUrl = new URL('/forgot-password', origin);
  forgotPasswordUrl.searchParams.set('reset_error', error);
  return NextResponse.redirect(forgotPasswordUrl);
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) return null;

  const baseUrl = 'https://wasatify.invalid';
  const destination = new URL(value, baseUrl);

  if (destination.origin !== baseUrl) return null;

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
