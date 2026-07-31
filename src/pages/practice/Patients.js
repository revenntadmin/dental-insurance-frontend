import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { getErrorMessage } from '../../lib/apiError';
import { practiceBasePath } from '../../lib/authNavigation';
import { formatDate } from '../../lib/forms';

const EMPTY_PATIENT = {
  first_name: '',
  last_name: '',
  dob: '',
  phone: '',
  address: '',
  guarantor_name: '',
};

export default function PatientsPage() {
  useTenancyGuard();
  const navigate = useNavigate();
  const { pid } = useParams();
  const { profile } = useAuth();
  const base = practiceBasePath(pid || profile?.practice_id);

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PATIENT);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounce typing so we hit /search only once the user pauses.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const request = query
      ? apiClient.get('/api/patient/search', { params: { q: query } })
      : apiClient.get('/api/patient');

    request
      .then(({ data }) => {
        if (!cancelled) setPatients(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load patients'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleForm() {
    setFormError('');
    setForm(EMPTY_PATIENT);
    setShowForm((open) => !open);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/patient', form);
      navigate(`${base}/patients/${data.id}`);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create patient'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Patients</h1>
        <button type="button" onClick={toggleForm}>
          {showForm ? 'Cancel' : 'New patient'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form form-grid" onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => updateField('dob', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="guarantorName">Guarantor name</label>
            <input
              id="guarantorName"
              type="text"
              value={form.guarantor_name}
              onChange={(e) => updateField('guarantor_name', e.target.value)}
            />
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              rows={2}
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create patient'}
          </button>
        </form>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search patients by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search patients by name"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of birth</th>
              <th>Phone</th>
              <th>Guarantor</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4}>{query ? 'No patients match that search.' : 'No patients yet.'}</td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="data-table__row--clickable"
                  onClick={() => navigate(`${base}/patients/${patient.id}`)}
                >
                  <td>
                    {patient.last_name}, {patient.first_name}
                  </td>
                  <td>{formatDate(patient.dob)}</td>
                  <td>{patient.phone || '—'}</td>
                  <td>{patient.guarantor_name || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
