export function formatCoverageStatus(status) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'error':
      return 'Check failed';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
  }
}

export function coverageBadgeClass(status) {
  if (status === 'active') return 'status-badge--active';
  if (status === 'inactive' || status === 'error') return 'status-badge--inactive';
  return 'status-badge--inactive';
}

export function shouldPromptReentry(eligibility) {
  if (!eligibility) return false;
  return Boolean(
    eligibility.requires_reentry
    || eligibility.coverage_active === false
    || eligibility.status === 'inactive',
  );
}

export function eligibilitySummary(eligibility) {
  if (!eligibility) return null;
  if (eligibility.error_message) return eligibility.error_message;
  if (eligibility.payer_network_valid === false) return eligibility.payer_network_message;
  if (eligibility.coverage_active === false) {
    return 'Coverage is inactive. Review and update the insurance information, then save again.';
  }
  if (eligibility.plan_name) return eligibility.plan_name;
  return 'Eligibility verified.';
}
