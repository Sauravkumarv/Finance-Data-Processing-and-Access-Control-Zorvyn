import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

// 🎨 same design tokens (light version)
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

export default function RecordsPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ amount: '', type: 'income', category: '', notes: '' });
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');

  const load = (params) =>
    api.records.list(token, params ?? filters)
      .then((d) => setRecords(d.records))
      .catch((e) => setError(e.message));

  useEffect(() => { load(filters); }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.records.create({ ...form, amount: Number(form.amount) }, token);
      setForm({ amount: '', type: 'income', category: '', notes: '' });
      load(filters);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api.records.remove(id, token);
    load(filters);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '30px', color: T.text, fontFamily: T.font }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

        {/* 🔥 ADD RECORD CARD */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px' }}>
          <h3>Add Record</h3>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={inputStyle}
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={inputStyle}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={inputStyle}
            />

            {error && <p style={{ color: T.red }}>{error}</p>}

            <button style={btnPrimary}>Save</button>
          </form>
        </div>

        {/* 🔥 RECORDS LIST */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px' }}>
          <h3>Your Records</h3>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {records.map((r) => (
              <li key={r._id} style={rowStyle}>
                <div>
                  <strong style={{ color: r.type === 'income' ? T.green : T.red }}>
                    {r.type.toUpperCase()}
                  </strong>{" "}
                  ${r.amount}
                  <div style={{ fontSize: '12px', color: T.muted }}>
                    {r.category} • {new Date(r.date).toLocaleDateString()}
                  </div>
                </div>

                <button onClick={() => remove(r._id)} style={btnDanger}>
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {records.length === 0 && <p style={{ color: T.muted }}>No records yet.</p>}
        </div>

      </div>
    </div>
  );
}

// 🔥 reusable styles
const inputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#111827',
  color: 'white'
};

const btnPrimary = {
  padding: '10px',
  background: '#4f7cff',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer'
};

const btnDanger = {
  padding: '6px 12px',
  background: 'rgba(255,107,107,0.2)',
  border: '1px solid rgba(255,107,107,0.4)',
  color: '#ff6b6b',
  borderRadius: '6px',
  cursor: 'pointer'
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};