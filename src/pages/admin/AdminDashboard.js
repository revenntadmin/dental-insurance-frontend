import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function AdminDashboard() {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [npi, setNpi] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadPractices() {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/admin/practice');
      setPractices(data);
    } catch (err) {
      setError(err.message || 'Failed to load practices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPractices();
  }, []);

  async function handleCreatePractice(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/admin/practice', { name, npi, tax_id: taxId, address });
      setName('');
      setNpi('');
      setTaxId('');
      setAddress('');
      setShowForm(false);
      await loadPractices();
    } catch (err) {
      setError(err.message || 'Failed to create practice');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Practices</h1>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Create Practice'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreatePractice}>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <label htmlFor="npi">NPI</label>
          <input id="npi" value={npi} onChange={(e) => setNpi(e.target.value)} />
          <label htmlFor="taxId">Tax ID</label>
          <input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          <label htmlFor="address">Address</label>
          <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <button type="submit" disabled={submitting}>
            Save
          </button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {practices.map((practice) => (
              <tr key={practice.id}>
                <td>
                  <Link to={`/admin/practice/${practice.id}`}>{practice.name}</Link>
                </td>
                <td>{practice.stedi_enrollment_status}</td>
                <td>{new Date(practice.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
