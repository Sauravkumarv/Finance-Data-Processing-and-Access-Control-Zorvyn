import AppNav from '../components/AppNav';
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';
import './RecordsPage.css';

const INITIAL_FORM = { amount: '', type: 'income', category: '', notes: '' };
const FILTERS = { type: '', category: '', startDate: '', endDate: '' };

export default function RecordsPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  const load = (params = FILTERS) =>
    api.records
      .list(token, params)
      .then((data) => setRecords(data.records))
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    load();
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.records.create({ ...form, amount: Number(form.amount) }, token);
      setForm(INITIAL_FORM);
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const remove = async (id) => {
    await api.records.remove(id, token);
    load();
  };

  return (
    <div className="records-page">
      <AppNav statusLabel="live · records" />

      <div className="records-page__shell">
        <div className="records-page__grid">
          <section className="records-card">
            <h3 className="records-card__title">Add Record</h3>

            <form className="records-form" onSubmit={submit}>
              <input
                className="records-form__field"
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />

              <select
                className="records-form__field"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <input
                className="records-form__field"
                placeholder="Category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />

              <input
                className="records-form__field"
                placeholder="Notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />

              {error && <p className="error">{error}</p>}

              <button className="records-button records-button--primary" type="submit">
                Save
              </button>
            </form>
          </section>

          <section className="records-card">
            <h3 className="records-card__title">Your Records</h3>

            <ul className="records-list">
              {records.map((record) => (
                <li key={record._id} className="records-list__item">
                  <div className="records-list__content">
                    <strong className={`records-list__type ${record.type === 'income' ? 'is-income' : 'is-expense'}`}>
                      {record.type.toUpperCase()}
                    </strong>{' '}
                    ${record.amount}
                    <div className="records-list__meta">
                      {record.category} • {new Date(record.date).toLocaleDateString()}
                    </div>
                  </div>

                  <button className="records-button records-button--danger" onClick={() => remove(record._id)} type="button">
                    Delete
                  </button>
                </li>
              ))}
            </ul>

            {records.length === 0 && <p className="records-empty">No records yet.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
