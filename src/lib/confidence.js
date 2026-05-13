export function band(conf) {
  if (conf == null || conf < 0.6) return 'red';
  if (conf < 0.85) return 'yellow';
  return 'green';
}

export function band_label(b) {
  if (b === 'red') return 'Please enter manually';
  if (b === 'yellow') return 'Review this field';
  return '';
}
