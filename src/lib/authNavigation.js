export function dashboardPath(profile) {
  if (!profile) return null;
  if (profile.role === 'super_admin') return '/';
  return null;
}
