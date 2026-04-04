import AppNav from '../components/AppNav';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';
import './UsersPage.css';

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    api.users
      .list(token)
      .then((data) => setUsers(data.users))
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    load();
  }, [token]);

  const updateUser = async (id, role, status) => {
    try {
      setUsers((current) => current.map((user) => (user._id === id ? { ...user, role, status } : user)));
      await api.users.update(id, { role, status }, token);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="users-page">
      <AppNav statusLabel="admin · users" />

      <div className="users-page__shell">
        {error ? (
          <p className="users-page__error">{error}</p>
        ) : (
          <section className="users-card">
            <h3 className="users-card__title">User Management</h3>

            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="users-pill users-pill--role">{user.role}</span>
                      </td>
                      <td>
                        <span className={`users-pill ${user.status === 'active' ? 'users-pill--active' : 'users-pill--inactive'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="users-actions">
                          <select
                            className="users-select"
                            value={user.role}
                            onChange={(event) => updateUser(user._id, event.target.value, user.status)}
                          >
                            <option value="viewer">viewer</option>
                            <option value="analyst">analyst</option>
                            <option value="admin">admin</option>
                          </select>

                          <select
                            className="users-select"
                            value={user.status}
                            onChange={(event) => updateUser(user._id, user.role, event.target.value)}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
