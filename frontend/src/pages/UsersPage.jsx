import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () => api.users.list(token).then((d) => setUsers(d.users)).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [token]);

  const updateUser = async (id, role, status) => {
    console.log("Updating:", { id, role, status }); 
    await api.users.update(id, { role, status }, token);
    load();
  };

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h3>User Management</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                <select value={u.role} onChange={(e) => updateUser(u._id, e.target.value, u.status)}>
                  <option value="viewer">viewer</option>
                  <option value="analyst">analyst</option>
                  <option value="admin">admin</option>
                </select>
                <select value={u.status} onChange={(e) => updateUser(u._id, u.role, e.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}