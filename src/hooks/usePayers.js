import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { getErrorMessage } from '../lib/apiError';

/**
 * The payer directory as the practice side sees it — read-only reference data, so it
 * is fetched once and shared by every plan form on the page rather than per row.
 */
export function usePayers() {
  const [payers, setPayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get('/api/payer')
      .then(({ data }) => {
        if (!cancelled) setPayers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load payers'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { payers, loading, error };
}
