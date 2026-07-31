/** Mirrors the patient endpoint's updatable fields. */
export const PATIENT_FIELDS = [
  'first_name',
  'last_name',
  'dob',
  'address',
  'phone',
  'guarantor_name',
];

export function patientName(patient) {
  return [patient?.first_name, patient?.last_name].filter(Boolean).join(' ').trim() || 'Patient';
}
