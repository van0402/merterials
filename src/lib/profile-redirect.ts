export function resolvePostSaveRedirect(returnTo?: string) {
  if (returnTo && returnTo.startsWith('/')) {
    return returnTo;
  }

  return '/supplier/dashboard';
}
