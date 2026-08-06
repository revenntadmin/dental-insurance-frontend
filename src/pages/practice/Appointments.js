import { useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../../api/apiClient';
import AppointmentDrawer from '../../components/AppointmentDrawer';
import AppointmentFilters from '../../components/AppointmentFilters';
import AppointmentGrid from '../../components/AppointmentGrid';
import AppointmentSummary from '../../components/AppointmentSummary';
import NewAppointmentForm from '../../components/NewAppointmentForm';
import { useProviders } from '../../hooks/useProviders';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { getErrorMessage } from '../../lib/apiError';
import {
  DEFAULT_FRESH_DAYS,
  MAX_BATCH_VERIFY,
  PAGE_SIZE,
  appointmentTypeOptions,
  batchResults,
  defaultRange,
  verifyOutcome,
} from '../../lib/appointments';

const MAX_LIMIT = 200;

function initialFilters() {
  const { from, to } = defaultRange();
  return {
    from,
    to,
    statuses: [],
    verifications: [],
    providerId: '',
    appointmentType: '',
    freshDays: DEFAULT_FRESH_DAYS,
    sort: 'date_asc',
  };
}

function listParams(filters, query, limit, offset) {
  const params = {
    from: filters.from,
    to: filters.to,
    fresh_days: filters.freshDays,
    sort: filters.sort,
    limit,
    offset,
  };

  // CSV rather than repeated params — both are accepted, and one key reads better in a log.
  if (filters.statuses.length) params.status = filters.statuses.join(',');
  if (filters.verifications.length) params.verification_status = filters.verifications.join(',');
  if (filters.providerId) params.provider_id = filters.providerId;
  if (filters.appointmentType) params.appointment_type = filters.appointmentType;
  if (query) params.q = query;

  return params;
}

export default function AppointmentsPage() {
  useTenancyGuard();
  const { providers, loading: providersLoading } = useProviders();

  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const [verifyingIds, setVerifyingIds] = useState([]);
  const [results, setResults] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchError, setBatchError] = useState('');

  const [drawerId, setDrawerId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce typing so a name search costs one request, not one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const paramsKey = JSON.stringify({ ...filters, query });

  /**
   * How many rows are on screen, so a refresh after a batch verify re-reads everything
   * the user has paged in rather than snapping back to the first page under them.
   * Reset when the filters change, kept when only the data did — hence the two effects
   * and their order.
   */
  const loadedRef = useRef(0);
  useEffect(() => {
    loadedRef.current = 0;
    setSelectedIds([]);
  }, [paramsKey]);

  useEffect(() => {
    let cancelled = false;
    const limit = Math.min(MAX_LIMIT, Math.max(PAGE_SIZE, loadedRef.current));

    setLoading(true);
    setError('');

    apiClient
      .get('/api/appointment', { params: listParams(filters, query, limit, 0) })
      .then(({ data }) => {
        if (cancelled) return;
        setAppointments(data);
        loadedRef.current = data.length;
        setHasMore(data.length >= limit);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load appointments'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, refreshKey]);

  // The strip counts the whole date range, so it stays honest above a paged grid.
  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);

    apiClient
      .get('/api/appointment/summary', {
        params: { from: filters.from, to: filters.to, fresh_days: filters.freshDays },
      })
      .then(({ data }) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.from, filters.to, filters.freshDays, refreshKey]);

  const typeOptions = useMemo(() => appointmentTypeOptions(appointments), [appointments]);
  const selectable = selectedIds.length < MAX_BATCH_VERIFY;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { data } = await apiClient.get('/api/appointment', {
        params: listParams(filters, query, PAGE_SIZE, appointments.length),
      });
      setAppointments((current) => [...current, ...data]);
      loadedRef.current += data.length;
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load more appointments'));
    } finally {
      setLoadingMore(false);
    }
  }

  function replaceRow(updated) {
    setAppointments((current) =>
      current.map((appointment) => (appointment.id === updated.id ? updated : appointment)),
    );
  }

  function toggleSelect(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= MAX_BATCH_VERIFY
          ? current
          : [...current, id],
    );
  }

  /** Selecting a whole day still respects the batch cap; it fills up to it and stops. */
  function toggleDay(dayIds, select) {
    setSelectedIds((current) => {
      if (!select) return current.filter((id) => !dayIds.includes(id));
      const next = [...current];
      for (const id of dayIds) {
        if (next.length >= MAX_BATCH_VERIFY) break;
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
  }

  async function verifyOne(id) {
    setVerifyingIds((current) => [...current, id]);
    setRowErrors((current) => ({ ...current, [id]: '' }));

    try {
      const { data } = await apiClient.post(`/api/appointment/${id}/verify`);
      setResults((current) => ({ ...current, [id]: data }));

      // verification_status is derived per request, so the row has to be re-read
      // before the badge can move.
      const { data: refreshed } = await apiClient.get(`/api/appointment/${id}`);
      replaceRow(refreshed);
    } catch (err) {
      setRowErrors((current) => ({
        ...current,
        [id]: getErrorMessage(err, 'Failed to run the eligibility check'),
      }));
    } finally {
      setVerifyingIds((current) => current.filter((value) => value !== id));
    }
  }

  async function verifySelected() {
    setBatchRunning(true);
    setBatchError('');

    try {
      const { data } = await apiClient.post('/api/appointment/verify_batch', {
        appointment_ids: selectedIds,
      });

      const items = batchResults(data);
      setResults((current) => {
        const next = { ...current };
        for (const item of items) {
          if (item?.appointment_id) next[item.appointment_id] = item;
        }
        return next;
      });

      setSelectedIds([]);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setBatchError(getErrorMessage(err, 'Failed to verify the selected appointments'));
    } finally {
      setBatchRunning(false);
    }
  }

  function dismissResult(id) {
    setResults((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setRowErrors((current) => ({ ...current, [id]: '' }));
  }

  function handleCreated(created) {
    setShowForm(false);
    setRefreshKey((key) => key + 1);
    // Straight into the drawer: a new visit is almost always followed by verifying it.
    setDrawerId(created.id);
  }

  function handleDeleted(id) {
    setAppointments((current) => current.filter((appointment) => appointment.id !== id));
    setSelectedIds((current) => current.filter((value) => value !== id));
    setRefreshKey((key) => key + 1);
  }

  const failedInBatch = selectedIds.length === 0
    ? Object.values(results).reduce((total, result) => total + verifyOutcome(result).failed, 0)
    : 0;

  return (
    <div className="page page--wide">
      <div className="page-header">
        <h1>Appointments</h1>
        <button type="button" onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'Cancel' : 'New appointment'}
        </button>
      </div>

      {showForm && (
        <NewAppointmentForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      <AppointmentSummary
        summary={summary}
        loading={summaryLoading}
        selected={filters.verifications}
        onToggle={(status) =>
          setFilters((current) => ({
            ...current,
            verifications: current.verifications.includes(status)
              ? current.verifications.filter((value) => value !== status)
              : [...current.verifications, status],
          }))
        }
      />

      <AppointmentFilters
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        providers={providers}
        providersLoading={providersLoading}
        typeOptions={typeOptions}
      />

      {selectedIds.length > 0 && (
        <div className="selection-bar">
          <span className="selection-bar__count">
            {selectedIds.length} selected
            {!selectable && ` · ${MAX_BATCH_VERIFY} is the most one batch can carry`}
          </span>
          <button type="button" onClick={verifySelected} disabled={batchRunning}>
            {batchRunning ? 'Checking...' : `Verify ${selectedIds.length} selected`}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setSelectedIds([])}
            disabled={batchRunning}
          >
            Clear
          </button>
          {batchRunning && (
            <span className="selection-bar__note">
              Checks run one payer at a time, so this takes a moment.
            </span>
          )}
        </div>
      )}

      {batchError && <p className="form-error">{batchError}</p>}
      {failedInBatch > 0 && (
        <p className="form-hint">
          {failedInBatch} plan check{failedInBatch === 1 ? '' : 's'} failed. Open the rows below to
          read what each payer said.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <p>No appointments match this range and these filters.</p>
        </div>
      ) : (
        <>
          <AppointmentGrid
            appointments={appointments}
            selectedIds={selectedIds}
            selectable={selectable}
            onToggleSelect={toggleSelect}
            onToggleDay={toggleDay}
            onOpen={setDrawerId}
            onVerify={verifyOne}
            verifyingIds={verifyingIds}
            results={results}
            errors={rowErrors}
            onDismissResult={dismissResult}
          />

          {hasMore && (
            <div className="appt-more">
              <button
                type="button"
                className="button-secondary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {drawerId && (
        <AppointmentDrawer
          appointmentId={drawerId}
          onClose={() => setDrawerId(null)}
          onUpdated={replaceRow}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
