import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🔥 SIMPLE VALIDATION
    if (!token) {
      setError("Unauthorized: No token found");
      return;
    }

    api.summary(token)
      .then((res) => {
        // 🔥 basic response validation
        if (!res) {
          setError("No data received");
          return;
        }
        setData(res);
      })
      .catch((e) => setError(e.message || "Something went wrong"));
  }, [token]);

  // 🔴 Error UI
  if (error) return <p className="error">{error}</p>;

  // ⏳ Loading UI
  if (!data) return <p>Loading summary...</p>;

  return (
    <div className="grid">

      <div className="card">
        <h3>Totals</h3>
        <p>Income: <strong>${data.totalIncome || 0}</strong></p>
        <p>Expense: <strong>${data.totalExpense || 0}</strong></p>
        <p>Net: <strong>${data.netBalance || 0}</strong></p>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        <ul>
          {(data.recentActivity || []).map((r) => (
            <li key={r._id}>
              {r.type || "N/A"} ${r.amount || 0} • 
              {r.date ? new Date(r.date).toLocaleDateString() : "No Date"} • 
              {r.category || "N/A"}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Category Totals</h3>
        <ul>
          {(data.categoryTotals || []).map((c) => (
            <li key={c.category}>
              {c.category || "N/A"}: ${c.total || 0} ({c.sampleType || "N/A"})
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Monthly Trends (last 12)</h3>
        <ul>
          {(data.monthlyTrends || []).map((m) => (
            <li key={`${m.year}-${m.month}`}>
              {m.month}/{m.year}: Income ${m.income || 0} | Expense ${m.expense || 0}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}