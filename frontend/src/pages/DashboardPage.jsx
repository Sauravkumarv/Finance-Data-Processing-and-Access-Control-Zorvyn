import AppNav from '../components/AppNav';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';
import './DashboardPage.css';

const CAT_COLORS = ['#00e5a0', '#4f7cff', '#ff6b6b', '#f5a623', '#a78bfa', '#38bdf8'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EMPTY_FILTERS = { type: '', category: '', startDate: '', endDate: '' };

const fmt = (value) =>
  '$' + Math.abs(Number(value) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const fmtSgn = (value) => (Number(value) >= 0 ? '+' : '−') + fmt(value);

function useDashboardAssets() {
  useEffect(() => {
    if (!window.Chart && !document.querySelector('#chartjs-script')) {
      const script = document.createElement('script');
      script.id = 'chartjs-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      document.head.appendChild(script);
    }
  }, []);
}

function SectionLabel({ children }) {
  return <p className="dashboard-section-label">{children}</p>;
}

function Spinner() {
  return <span className="dashboard-spinner" aria-hidden="true" />;
}

function KpiCard({ label, value, sub, tone, icon }) {
  return (
    <article className={`dashboard-card dashboard-kpi dashboard-kpi--${tone}`}>
      <div className="dashboard-kpi__accent" />
      <span className="dashboard-kpi__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="dashboard-kpi__label">{label}</p>
      <p className="dashboard-kpi__value">{value}</p>
      <p className="dashboard-kpi__sub">{sub}</p>
    </article>
  );
}

function FilterPanel({ filters, setFilters, onApply, onClear, loading }) {
  return (
    <section className="dashboard-card dashboard-filters">
      <SectionLabel>filters</SectionLabel>

      <div className="dashboard-filters__grid">
        <select
          className="dashboard-field dashboard-field--select"
          value={filters.type}
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          className="dashboard-field"
          placeholder="Category"
          value={filters.category}
          onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
        />

        <label className="dashboard-field-group">
          <span className="dashboard-field-group__label">from</span>
          <input
            className="dashboard-field dashboard-field--date"
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              setFilters((current) => ({ ...current, startDate: event.target.value }))
            }
          />
        </label>

        <label className="dashboard-field-group">
          <span className="dashboard-field-group__label">to</span>
          <input
            className="dashboard-field dashboard-field--date"
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          />
        </label>
      </div>

      <div className="dashboard-filters__actions">
        <button className="dashboard-button dashboard-button--primary" onClick={onApply} disabled={loading}>
          {loading && <Spinner />}
          <span>apply filters</span>
        </button>
        <button className="dashboard-button dashboard-button--ghost" onClick={onClear} disabled={loading}>
          clear
        </button>
      </div>
    </section>
  );
}

function TrendChart({ trends }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [ready, setReady] = useState(Boolean(window.Chart));

  useEffect(() => {
    if (window.Chart) {
      setReady(true);
      return undefined;
    }

    const poll = window.setInterval(() => {
      if (window.Chart) {
        setReady(true);
        window.clearInterval(poll);
      }
    }, 100);

    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!ready || !canvasRef.current || !trends?.length) {
      return undefined;
    }

    chartRef.current?.destroy();

    const sorted = [...trends].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

    chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: sorted.map((month) => MONTHS[month.month - 1]),
        datasets: [
          {
            label: 'income',
            data: sorted.map((month) => month.income),
            backgroundColor: 'rgba(0,229,160,0.13)',
            borderColor: '#00e5a0',
            borderWidth: 1.5,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'expense',
            data: sorted.map((month) => month.expense),
            backgroundColor: 'rgba(255,107,107,0.10)',
            borderColor: '#ff6b6b',
            borderWidth: 1.5,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f1422',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#5a6080',
            bodyColor: '#e8eaf0',
            titleFont: { family: 'DM Mono', size: 11 },
            bodyFont: { family: 'DM Mono', size: 12 },
            callbacks: {
              label: (context) => ' ' + fmt(context.parsed.y),
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#3d4460', font: { family: 'DM Mono', size: 10 }, autoSkip: false },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#3d4460',
              font: { family: 'DM Mono', size: 10 },
              callback: (value) => '$' + (value / 1000).toFixed(0) + 'k',
            },
            border: { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [ready, trends]);

  return (
    <section className="dashboard-card dashboard-chart">
      <div className="dashboard-chart__header">
        <span className="dashboard-panel-title">12-month cashflow</span>
        <div className="dashboard-chart__legend">
          {[
            { color: 'var(--accent)', label: 'income' },
            { color: 'var(--warn)', label: 'expense' },
          ].map(({ color, label }) => (
            <div key={label} className="dashboard-chart__legend-item">
              <span className="dashboard-chart__legend-dot" style={{ '--legend-color': color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {!ready || !trends?.length ? (
        <div className="dashboard-chart__empty">
          <Spinner />
        </div>
      ) : (
        <div className="dashboard-chart__canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
      )}
    </section>
  );
}

function ActivityCard({ records = [], meta = {} }) {
  const pageSize = meta.pageSize || 5;
  const totalPages = meta.totalPages || Math.max(1, Math.ceil(records.length / pageSize));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, totalPages);
  const slice = meta.totalPages ? records : records.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="dashboard-card dashboard-panel">
      <p className="dashboard-panel-title">
        recent activity
        {meta.total > 0 && <span className="dashboard-panel-title__meta">{meta.total} records</span>}
      </p>

      {slice.length === 0 ? (
        <p className="dashboard-empty-state">no records</p>
      ) : (
        slice.map((record, index) => <ActivityRow key={record._id || index} record={record} />)
      )}

      {totalPages > 1 && (
        <div className="dashboard-pagination">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((currentPage) => (
            <button
              key={currentPage}
              className={`dashboard-pagination__button${currentPage === safePage ? ' is-active' : ''}`}
              onClick={() => setPage(currentPage)}
            >
              {currentPage}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityRow({ record }) {
  const isIncome = record.type === 'income';

  return (
    <article className="dashboard-activity-row">
      <div className="dashboard-activity-row__content">
        <div className="dashboard-activity-row__title">{record.description || record.category || 'N/A'}</div>
        <div className="dashboard-activity-row__meta">
          {record.category || 'N/A'}
          {record.date ? ` · ${new Date(record.date).toLocaleDateString()}` : ''}
          {record.owner ? ` · ${record.owner.name} (${record.owner.role})` : ''}
        </div>
      </div>
      <div className={`dashboard-activity-row__amount ${isIncome ? 'is-income' : 'is-expense'}`}>
        {isIncome ? '+' : '−'}
        {fmt(record.amount)}
      </div>
    </article>
  );
}

function CategoryCard({ categories = [] }) {
  const max = categories.length ? Math.max(...categories.map((category) => category.total)) : 1;

  return (
    <section className="dashboard-card dashboard-panel">
      <p className="dashboard-panel-title">top categories</p>

      {categories.length === 0 ? (
        <p className="dashboard-empty-state">no data</p>
      ) : (
        categories.map((category, index) => (
          <CategoryRow
            key={category.category}
            category={category.category}
            total={category.total}
            type={category.sampleType}
            pct={Math.round((category.total / max) * 100)}
            color={CAT_COLORS[index % CAT_COLORS.length]}
          />
        ))
      )}
    </section>
  );
}

function CategoryRow({ category, total, type, pct, color }) {
  return (
    <article className="dashboard-category-row">
      <div className="dashboard-category-row__header">
        <div className="dashboard-category-row__meta">
          <span className="dashboard-category-row__name">{category || 'N/A'}</span>
          <span className={`dashboard-badge ${type === 'income' ? 'is-income' : 'is-expense'}`}>
            {type || 'N/A'}
          </span>
        </div>
        <div className="dashboard-category-row__values">
          <span className="dashboard-category-row__total">{fmt(total)}</span>
          <span className="dashboard-category-row__percent">{pct}%</span>
        </div>
      </div>

      <div className="dashboard-category-row__bar">
        <div
          className="dashboard-category-row__fill"
          style={{ '--bar-width': `${pct}%`, '--bar-color': color }}
        />
      </div>
    </article>
  );
}

function MonthlyList({ trends = [] }) {
  const sorted = [...trends].sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));

  return (
    <section className="dashboard-card dashboard-panel">
      <p className="dashboard-panel-title">monthly breakdown</p>

      {sorted.length === 0 ? (
        <p className="dashboard-empty-state">no data</p>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                {['month', 'income', 'expense', 'net'].map((heading) => (
                  <th key={heading} className={heading === 'month' ? '' : 'is-right'}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((month) => {
                const net = (month.income || 0) - (month.expense || 0);

                return (
                  <tr key={`${month.year}-${month.month}`}>
                    <td>
                      {MONTHS[month.month - 1]} {month.year}
                    </td>
                    <td className="is-right is-income">{fmt(month.income)}</td>
                    <td className="is-right is-expense">{fmt(month.expense)}</td>
                    <td className={`is-right ${net >= 0 ? 'is-net-positive' : 'is-expense'}`}>
                      {fmtSgn(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dashboard-error-banner">
      <span>{message}</span>
      {onRetry && (
        <button className="dashboard-error-banner__button" onClick={onRetry}>
          retry
        </button>
      )}
    </div>
  );
}

function SkeletonCard({ height = 120 }) {
  return <div className="dashboard-card dashboard-skeleton" style={{ '--skeleton-height': `${height}px` }} />;
}

export default function DashboardPage() {
  useDashboardAssets();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const load = useCallback(
    async (params) => {
      if (!token) {
        setError('Unauthorized: No token found');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.summary(token, params);
        setData(response);
      } catch (requestError) {
        setError(requestError.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(EMPTY_FILTERS);
  }, [load]);

  const applyFilters = () => load(filters);

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  };

  const expenseRatio = data?.totalIncome ? Math.round((data.totalExpense / data.totalIncome) * 100) : 0;

  return (
    <div className="dashboard-page">
      <AppNav busy={loading} statusLabel={loading ? 'syncing…' : 'live · dashboard'} />

      <div className="dashboard-shell">
        {error && <ErrorBanner message={error} onRetry={() => load(filters)} />}

        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
          loading={loading}
        />

        <SectionLabel>overview</SectionLabel>
        <div className="dashboard-kpi-grid">
          {!data ? (
            [0, 1, 2].map((index) => <SkeletonCard key={index} height={130} />)
          ) : (
            <>
              <KpiCard label="total income" icon="↑" value={fmt(data.totalIncome)} sub="this period" tone="income" />
              <KpiCard
                label="total expenses"
                icon="↓"
                value={fmt(data.totalExpense)}
                sub={`${expenseRatio}% of income`}
                tone="expense"
              />
              <KpiCard
                label="net balance"
                icon="≈"
                value={fmtSgn(data.netBalance)}
                sub="income − expenses"
                tone="net"
              />
            </>
          )}
        </div>

        <SectionLabel>monthly trends</SectionLabel>
        {!data ? <SkeletonCard height={310} /> : <TrendChart trends={data.monthlyTrends || []} />}

        <SectionLabel>breakdown &amp; activity</SectionLabel>
        <div className="dashboard-split-grid">
          {!data ? (
            [0, 1].map((index) => <SkeletonCard key={index} height={320} />)
          ) : (
            <>
              <ActivityCard records={data.recentActivity || []} meta={data.recentMeta || {}} />
              <CategoryCard categories={data.categoryTotals || []} />
            </>
          )}
        </div>

        <SectionLabel>monthly detail</SectionLabel>
        {!data ? <SkeletonCard height={240} /> : <MonthlyList trends={data.monthlyTrends || []} />}
      </div>
    </div>
  );
}
