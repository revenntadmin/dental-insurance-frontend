export function dashboardPath(profile) {
  if (!profile) return null;
  if (profile.role === 'super_admin') return '/';
  if (profile.practice_id) return `/p/${profile.practice_id}/dashboard`;
  return null;
}

export function isSuperAdmin(profile) {
  return profile?.role === 'super_admin';
}

export function isPracticeAdmin(profile) {
  return profile?.role === 'practice_admin';
}

export function practiceBasePath(practiceId) {
  return `/p/${practiceId}`;
}

export function formatRole(role) {
  const labels = {
    super_admin: 'Super Admin',
    practice_admin: 'Practice Admin',
    office_manager: 'Office Manager',
    billing_coordinator: 'Billing Coordinator',
  };
  return labels[role] || role;
}

export function displayName(profile) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  return name || profile?.email || 'Account';
}
