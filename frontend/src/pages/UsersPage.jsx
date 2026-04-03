import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

// 🎨 Design tokens
const T = {
  bg: '#0b0f1a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#e8eaf0',
  muted: '#9099b8',
  accent: '#4f7cff',
  green: '#00e5a0',
  red: '#ff6b6b',
  radius: '12px',
  font: "'DM Mono', monospace"
};

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    api.users.list(token)
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, [token]);

  const updateUser = async (id, role, status) => {
    try {
      // 🔥 Optimistic UI update
      setUsers(prev =>
        prev.map(u => u._id === id ? { ...u, role, status } : u)
      );

      await api.users.update(id, { role, status }, token);

    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p style={{ color: T.red }}>{error}</p>;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '30px', color: T.text, fontFamily: T.font }}>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px' }}>

        <h3 style={{ marginBottom: '20px' }}>User Management</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>

            <thead>
              <tr style={{ textAlign: 'left', color: T.muted }}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={row}>

                  <td style={td}>{u.name}</td>

                  <td style={td}>{u.email}</td>

                  <td style={td}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(79,124,255,0.15)',
                      border: '1px solid rgba(79,124,255,0.4)',
                      color: T.accent,
                      fontSize: '12px'
                    }}>
                      {u.role}
                    </span>
                  </td>

                  <td style={td}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: u.status === 'active'
                        ? 'rgba(0,229,160,0.15)'
                        : 'rgba(255,107,107,0.15)',
                      border: u.status === 'active'
                        ? '1px solid rgba(0,229,160,0.4)'
                        : '1px solid rgba(255,107,107,0.4)',
                      color: u.status === 'active' ? T.green : T.red,
                      fontSize: '12px'
                    }}>
                      {u.status}
                    </span>
                  </td>

                  <td style={td}>
                    <div style={{ display: 'flex', gap: '8px' }}>

                      <select
                        value={u.role}
                        onChange={(e) => updateUser(u._id, e.target.value, u.status)}
                        style={selectStyle}
                      >
                        <option value="viewer">viewer</option>
                        <option value="analyst">analyst</option>
                        <option value="admin">admin</option>
                      </select>

                      <select
                        value={u.status}
                        onChange={(e) => updateUser(u._id, u.role, e.target.value)}
                        style={selectStyle}
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

      </div>
    </div>
  );
}

// 🔥 styles
const th = {
  padding: '10px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  fontSize: '13px'
};

const td = {
  padding: '12px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const row = {
  transition: '0.2s',
};

const selectStyle = {
  padding: '6px',
  borderRadius: '6px',
  background: '#111827',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.1)'
};