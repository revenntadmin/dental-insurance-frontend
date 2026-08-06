import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { getErrorMessage } from '../lib/apiError';
import { sortProviders } from '../lib/providers';

/**
 * The practice's rendering providers, for the appointment filter and form. A practice
 * has tens of these rather than hundreds, so this asks for the maximum page once and
 * shares it rather than paging.
 */
export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get('/api/provider', { params: { limit: 200 } })
      .then(({ data }) => {
        if (!cancelled) setProviders(sortProviders(data));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load providers'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { providers, loading, error };
}
