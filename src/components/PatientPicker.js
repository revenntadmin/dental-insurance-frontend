import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { getErrorMessage } from '../lib/apiError';
import { formatDate } from '../lib/forms';
import { patientName } from '../lib/patients';

/**
 * patient_id is the one field an appointment can never be re-pointed at afterwards —
 * a patch that moved a visit would orphan its procedures and eligibility checks — so
 * booking starts by naming the patient and the choice is deliberate rather than a
 * dropdown default.
 *
 * Search hits /api/patient/search, the same endpoint the patients list uses.
 */
export default function PatientPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (value || query.length < 2) {
      setResults([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get('/api/patient/search', { params: { q: query } })
      .then(({ data }) => {
        if (!cancelled) setResults(data.slice(0, 8));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to search patients'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, value]);

  if (value) {
    return (
      <div className="form-field form-field--full">
        <label>Patient</label>
        <div className="patient-picker__chosen">
          <span className="patient-picker__chosen-name">{patientName(value)}</span>
          <span className="patient-picker__chosen-meta">
            DOB {formatDate(value.dob)}
            {value.phone ? ` · ${value.phone}` : ''}
          </span>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              onChange(null);
              setSearch('');
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-field form-field--full patient-picker">
      <label htmlFor="apptPatientSearch">Patient</label>
      <input
        id="apptPatientSearch"
        type="search"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoComplete="off"
      />

      {error && <p className="form-error">{error}</p>}

      {query.length >= 2 && (
        <div className="patient-picker__results">
          {loading ? (
            <p className="patient-picker__note">Searching...</p>
          ) : results.length === 0 ? (
            <p className="patient-picker__note">No patients match that name.</p>
          ) : (
            results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className="patient-picker__option"
                onClick={() => onChange(patient)}
              >
                <span className="patient-picker__option-name">{patientName(patient)}</span>
                <span className="patient-picker__option-meta">DOB {formatDate(patient.dob)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
