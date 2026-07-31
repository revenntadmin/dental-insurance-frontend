export function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}
