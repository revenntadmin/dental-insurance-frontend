export function dashboard_path(profile) {
  if (!profile) return null;
  if (profile.role === 'clearclaim_admin') return '/admin/dashboard';
  if (profile.practice_id) return `/p/${profile.practice_id}/dashboard`;
  return null;
}
