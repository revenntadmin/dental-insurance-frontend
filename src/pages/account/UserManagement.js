import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { formatRole, isPracticeAdmin } from '../../lib/authNavigation';
import { PRACTICE_ROLES } from '../../lib/roles';

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

export default function UserManagementPage() {
  useTenancyGuard();
  const { profile } = useAuth();
  const canManage = isPracticeAdmin(profile);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(PRACTICE_ROLES[1]);
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/api/practice/me/users');
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManage) loadUsers();
  }, [canManage]);

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/practice/me/users', { email, role });
      setEmail('');
      setRole(PRACTICE_ROLES[1]);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to invite user'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canManage) {
    return <Navigate to={`/p/${profile?.practice_id}/dashboard`} replace />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add user'}
        </button>
      </div>

      <p className="form-hint">Invite team members to your practice and assign their role.</p>

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
            {PRACTICE_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRole(r)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending invite...' : 'Send invite'}
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={3}>No users yet.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{formatRole(user.role)}</td>
                  <td>{user.invite_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
