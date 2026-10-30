export function getEmailConfirmationRedirectUrl(origin: string) {
  const callbackUrl = new URL('/auth/callback', origin);
  const confirmationUrl = new URL('/register/confirmation', origin);
  confirmationUrl.searchParams.set('method', 'email');
  confirmationUrl.searchParams.set('confirmed', '1');
  callbackUrl.searchParams.set('next', `${confirmationUrl.pathname}${confirmationUrl.search}`);
  return callbackUrl.toString();
}

export function getPasswordRecoveryRedirectUrl(origin: string) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', '/reset-password');
  return callbackUrl.toString();
}
