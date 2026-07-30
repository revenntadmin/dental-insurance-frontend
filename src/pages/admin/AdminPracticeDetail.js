import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const ROLES = ['practice_admin', 'office_manager', 'billing_coordinator'];

export default function AdminPracticeDetail() {
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/admin/practice/${id}/user`);
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [id]);

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/admin/practice/${id}/user`, { email, role });
      setEmail('');
      setRole(ROLES[0]);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Practice Users</h1>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleAddUser}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={submitting}>
            Send Invite
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
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.invite_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
