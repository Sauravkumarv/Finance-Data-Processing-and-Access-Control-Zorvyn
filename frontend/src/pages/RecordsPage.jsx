import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

export default function RecordsPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ amount: '', type: 'income', category: '', notes: '' });
  const [error, setError] = useState('');

  const load = () => api.records.list(token).then((d) => setRecords(d.records)).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.records.create({ ...form, amount: Number(form.amount) }, token);
      setForm({ amount: '', type: 'income', category: '', notes: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api.records.remove(id, token);
    load();
  };

  return (
    <div className="grid two">
      <div className="card">
        <h3>Add Record</h3>
        <form onSubmit={submit} className="stack">
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Save</button>
        </form>
      </div>

      <div className="card">
        <h3>Your Records</h3>
        <ul className="list">
          {records.map((r) => (
            <li key={r._id} className="list-row">
              <div>
                <strong>{r.type}</strong> ${r.amount} • {r.category}
                <div className="muted">{new Date(r.date).toLocaleDateString()} • {r.notes}</div>
              </div>
              <button className="link-btn" onClick={() => remove(r._id)}>Delete</button>
            </li>
          ))}
          {records.length === 0 && <p className="muted">No records yet.</p>}
        </ul>
      </div>
    </div>
  );
}