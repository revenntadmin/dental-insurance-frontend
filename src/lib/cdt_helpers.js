const VALID_TOOTH = new Set([
  ...Array.from({ length: 32 }, (_, i) => String(i + 1)),
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
]);

const VALID_SURFACES = new Set(['M', 'O', 'D', 'B', 'L', 'I', 'F']);

export function is_valid_tooth(value) {
  if (!value) return false;
  return VALID_TOOTH.has(String(value).toUpperCase());
}

export function is_valid_surfaces(value) {
  if (!value) return false;
  const chars = String(value).toUpperCase().split('');
  if (chars.length === 0 || chars.length > 5) return false;
  return chars.every((c) => VALID_SURFACES.has(c));
}

export function normalize_surfaces(value) {
  if (!value) return '';
  return Array.from(new Set(String(value).toUpperCase().split('')))
    .filter((c) => VALID_SURFACES.has(c))
    .join('');
}
