import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  accent:   '#00e5a0',
  accent2:  '#4f7cff',
  warn:     '#ff6b6b',
  amber:    '#f5a623',
  bgBase:   '#0b0f1a',
  bgSurface:'rgba(255,255,255,0.03)',
  bgHover:  'rgba(255,255,255,0.05)',
  bgInput:  'rgba(11,18,35,0.85)',
  bgNav:    'rgba(10,14,26,0.95)',
  border:        'rgba(255,255,255,0.07)',
  borderHover:   'rgba(255,255,255,0.14)',
  borderFocus:   'rgba(79,124,255,0.55)',
  textPrimary:   '#e8eaf0',
  textSecondary: '#9099b8',
  textMuted:     '#5a6080',
  textFaint:     '#3d4460',
  radiusSm:  '6px',
  radiusMd:  '10px',
  radiusLg:  '14px',
  radiusPill:'50px',
  fontSans:  "'Syne', sans-serif",
  fontMono:  "'DM Mono', monospace",
};

const CAT_COLORS = [T.accent, T.accent2, T.warn, T.amber, '#a78bfa', '#38bdf8'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt    = v => '$' + Math.abs(Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtSgn = v => (Number(v) >= 0 ? '+' : '−') + fmt(v);

// ─── Global styles injected once ─────────────────────────────────────────────
function useGlobalStyles() {
  useEffect(() => {
    if (!document.querySelector('#db-font-link')) {
      const link = document.createElement('link');
      link.id   = 'db-font-link';
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.querySelector('#db-keyframes')) {
      const s = document.createElement('style');
      s.id = 'db-keyframes';
      s.textContent = `
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.85); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(s);
    }
    if (!window.Chart && !document.querySelector('#chartjs-script')) {
      const s = document.createElement('script');
      s.id  = 'chartjs-script';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      document.head.appendChild(s);
    }
  }, []);
}

// ─── Reusable primitives ──────────────────────────────────────────────────────
const cardStyle = (extra = {}) => ({
  background: T.bgSurface,
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusLg,
  padding: '22px 24px',
  position: 'relative',
  overflow: 'hidden',
  ...extra,
});

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: T.fontMono, fontSize: '0.64rem', letterSpacing: '2.5px',
      textTransform: 'uppercase', color: T.textFaint, marginBottom: '14px',
    }}>
      {children}
    </p>
  );
}

function LiveDot() {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: T.accent, animation: 'livePulse 2s ease-in-out infinite',
    }} />
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTopColor: T.accent2,
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ loading }) {
  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 28px',
      background: T.bgNav,
      backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 0, zIndex: 100,
      fontFamily: T.fontSans,
    }}>
      <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.5px', color: T.accent }}>
        ledger<span style={{ color: T.textPrimary }}>view</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontMono, fontSize: '0.72rem', color: T.textMuted }}>
        {loading ? <Spinner /> : <LiveDot />}
        {loading ? 'syncing…' : 'live · dashboard'}
      </div>
    </nav>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accentColor, icon, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle(),
        animation: `fadeUp 0.4s ease ${delay}s both`,
        borderColor: hovered ? T.borderHover : T.border,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accentColor }} />
      <span style={{ position: 'absolute', right: 20, top: 18, fontSize: '1.4rem', opacity: 0.12, fontFamily: T.fontMono }}>{icon}</span>
      <p style={{ fontFamily: T.fontMono, fontSize: '0.66rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: T.textMuted, marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontFamily: T.fontMono, fontSize: '2rem', fontWeight: 500, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8, color: accentColor }}>
        {value}
      </p>
      <p style={{ fontFamily: T.fontMono, fontSize: '0.7rem', color: T.textFaint }}>{sub}</p>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, setFilters, onApply, onClear, loading }) {
  const [focused, setFocused] = useState('');

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd, color: T.textPrimary,
    fontFamily: T.fontMono, fontSize: '0.82rem',
    outline: 'none', appearance: 'none', WebkitAppearance: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const focusStyle = name => focused === name
    ? { borderColor: T.borderFocus, boxShadow: '0 0 0 3px rgba(79,124,255,0.13)' }
    : {};

  return (
    <div style={{ ...cardStyle(), marginBottom: 28, animation: 'fadeUp 0.35s ease 0s both' }}>
      <SectionLabel>filters</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>

        <select
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          onFocus={() => setFocused('type')}
          onBlur={() => setFocused('')}
          style={{
            ...inputStyle, ...focusStyle('type'), cursor: 'pointer',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235a6080' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34,
          }}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          placeholder="Category"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          onFocus={() => setFocused('cat')}
          onBlur={() => setFocused('')}
          style={{ ...inputStyle, ...focusStyle('cat') }}
        />

        <div>
          <label style={{ fontFamily: T.fontMono, fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: T.textFaint, display: 'block', marginBottom: 5 }}>from</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            onFocus={() => setFocused('sd')}
            onBlur={() => setFocused('')}
            style={{ ...inputStyle, ...focusStyle('sd'), colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label style={{ fontFamily: T.fontMono, fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: T.textFaint, display: 'block', marginBottom: 5 }}>to</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            onFocus={() => setFocused('ed')}
            onBlur={() => setFocused('')}
            style={{ ...inputStyle, ...focusStyle('ed'), colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onApply}
          disabled={loading}
          style={{
            fontFamily: T.fontMono, fontSize: '0.78rem', fontWeight: 500,
            padding: '9px 22px', borderRadius: T.radiusMd,
            background: 'rgba(79,124,255,0.15)', border: `1px solid rgba(79,124,255,0.4)`,
            color: T.accent2, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1, transition: 'all 0.18s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {loading && <Spinner />}
          apply filters
        </button>
        <button
          onClick={onClear}
          disabled={loading}
          style={{
            fontFamily: T.fontMono, fontSize: '0.78rem',
            padding: '9px 22px', borderRadius: T.radiusMd,
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.textMuted, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1, transition: 'all 0.18s',
          }}
        >
          clear
        </button>
      </div>
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────
function TrendChart({ trends }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const [ready, setReady] = useState(!!window.Chart);

  useEffect(() => {
    if (window.Chart) { setReady(true); return; }
    const poll = setInterval(() => { if (window.Chart) { setReady(true); clearInterval(poll); } }, 100);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!ready || !canvasRef.current || !trends?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const sorted = [...trends].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: sorted.map(m => MONTHS[m.month - 1]),
        datasets: [
          {
            label: 'income',
            data: sorted.map(m => m.income),
            backgroundColor: 'rgba(0,229,160,0.13)',
            borderColor: T.accent, borderWidth: 1.5,
            borderRadius: 4, borderSkipped: false,
          },
          {
            label: 'expense',
            data: sorted.map(m => m.expense),
            backgroundColor: 'rgba(255,107,107,0.1)',
            borderColor: T.warn, borderWidth: 1.5,
            borderRadius: 4, borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f1422',
            borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
            titleColor: T.textMuted, bodyColor: T.textPrimary,
            titleFont: { family: T.fontMono, size: 11 },
            bodyFont:  { family: T.fontMono, size: 12 },
            callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: T.textFaint, font: { family: T.fontMono, size: 10 }, autoSkip: false },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: T.textFaint, font: { family: T.fontMono, size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'k' },
            border: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [ready, trends]);

  return (
    <div style={{ ...cardStyle(), marginBottom: 28, animation: 'fadeUp 0.4s ease 0.2s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontFamily: T.fontSans, fontSize: '0.88rem', fontWeight: 500, color: T.textSecondary }}>
          12-month cashflow
        </span>
        <div style={{ display: 'flex', gap: 18 }}>
          {[[T.accent, 'income'], [T.warn, 'expense']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: T.fontMono, fontSize: '0.68rem', color: T.textMuted }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </div>
          ))}
        </div>
      </div>
      {!ready || !trends?.length
        ? <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
        : <div style={{ position: 'relative', width: '100%', height: 240 }}><canvas ref={canvasRef} /></div>
      }
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────
function ActivityCard({ records = [], meta = {} }) {
  const PAGE_SIZE  = meta.pageSize || 5;
  const totalPages = meta.totalPages || Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, totalPages);

  // Client-side slice only when server pagination isn't used
  const slice = meta.totalPages ? records : records.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div style={{ ...cardStyle({ padding: '20px 22px', marginBottom: 0 }), animation: 'fadeUp 0.4s ease 0.25s both' }}>
      <p style={{ fontFamily: T.fontSans, fontSize: '0.82rem', fontWeight: 500, color: T.textSecondary, marginBottom: 16 }}>
        recent activity
        {meta.total > 0 && (
          <span style={{ fontFamily: T.fontMono, fontSize: '0.66rem', color: T.textFaint, marginLeft: 10 }}>
            {meta.total} records
          </span>
        )}
      </p>

      {slice.length === 0
        ? <p style={{ fontFamily: T.fontMono, fontSize: '0.74rem', color: T.textFaint, textAlign: 'center', padding: '20px 0' }}>no records</p>
        : slice.map((r, i) => <ActivityRow key={r._id || i} record={r} delay={i * 0.04} />)
      }

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                fontFamily: T.fontMono, fontSize: '0.68rem',
                padding: '5px 12px', borderRadius: T.radiusSm,
                border: `1px solid ${p === safePage ? 'rgba(79,124,255,0.5)' : T.border}`,
                background: p === safePage ? 'rgba(79,124,255,0.08)' : 'transparent',
                color: p === safePage ? T.accent2 : T.textMuted,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ record: r, delay }) {
  const [hovered, setHovered] = useState(false);
  const isIncome = r.type === 'income';
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: hovered ? '10px 8px' : '10px 2px',
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        fontFamily: T.fontMono, fontSize: '0.75rem',
        background: hovered ? T.bgHover : 'transparent',
        borderRadius: hovered ? T.radiusSm : 0,
        transition: 'all 0.15s', cursor: 'default',
        animation: `fadeUp 0.3s ease ${delay}s both`,
      }}
    >
      <div>
        <div style={{ color: T.textSecondary, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.description || r.category || 'N/A'}
        </div>
        <div style={{ color: T.textFaint, fontSize: '0.64rem', marginTop: 2 }}>
          {r.category || 'N/A'}
          {r.date ? ` · ${new Date(r.date).toLocaleDateString()}` : ''}
          {r.owner ? ` · ${r.owner.name} (${r.owner.role})` : ''}
        </div>
      </div>
      <div style={{ color: isIncome ? T.accent : T.warn, fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
        {isIncome ? '+' : '−'}{fmt(r.amount)}
      </div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ categories = [] }) {
  const max = categories.length ? Math.max(...categories.map(c => c.total)) : 1;
  return (
    <div style={{ ...cardStyle({ padding: '20px 22px', marginBottom: 0 }), animation: 'fadeUp 0.4s ease 0.3s both' }}>
      <p style={{ fontFamily: T.fontSans, fontSize: '0.82rem', fontWeight: 500, color: T.textSecondary, marginBottom: 18 }}>
        top categories
      </p>
      {categories.length === 0
        ? <p style={{ fontFamily: T.fontMono, fontSize: '0.74rem', color: T.textFaint, textAlign: 'center', padding: '20px 0' }}>no data</p>
        : categories.map((c, i) => (
          <CategoryRow
            key={c.category}
            category={c.category}
            total={c.total}
            type={c.sampleType}
            pct={Math.round(c.total / max * 100)}
            color={CAT_COLORS[i % CAT_COLORS.length]}
            delay={i * 0.05}
          />
        ))
      }
    </div>
  );
}

function CategoryRow({ category, total, type, pct, color, delay }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay * 1000 + 150);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{ marginBottom: 14, animation: `fadeUp 0.3s ease ${delay}s both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: T.fontMono, fontSize: '0.72rem', color: T.textSecondary, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {category || 'N/A'}
          </span>
          <span style={{
            fontFamily: T.fontMono, fontSize: '0.6rem', padding: '2px 8px',
            borderRadius: T.radiusPill,
            background: type === 'income' ? 'rgba(0,229,160,0.1)' : 'rgba(255,107,107,0.1)',
            border: `1px solid ${type === 'income' ? 'rgba(0,229,160,0.25)' : 'rgba(255,107,107,0.25)'}`,
            color: type === 'income' ? T.accent : T.warn,
          }}>
            {type || 'N/A'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.fontMono, fontSize: '0.7rem', color: T.textSecondary }}>{fmt(total)}</span>
          <span style={{ fontFamily: T.fontMono, fontSize: '0.66rem', color: T.textFaint, minWidth: 30, textAlign: 'right' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, background: color,
          width: mounted ? `${pct}%` : '0%',
          transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── Monthly detail table ─────────────────────────────────────────────────────
function MonthlyList({ trends = [] }) {
  const sorted = [...trends].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  return (
    <div style={{ ...cardStyle({ padding: '20px 22px' }), animation: 'fadeUp 0.4s ease 0.35s both' }}>
      <p style={{ fontFamily: T.fontSans, fontSize: '0.82rem', fontWeight: 500, color: T.textSecondary, marginBottom: 16 }}>
        monthly breakdown
      </p>
      {sorted.length === 0
        ? <p style={{ fontFamily: T.fontMono, fontSize: '0.74rem', color: T.textFaint, textAlign: 'center', padding: '20px 0' }}>no data</p>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontMono, fontSize: '0.75rem' }}>
            <thead>
              <tr>
                {['month', 'income', 'expense', 'net'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'month' ? 'left' : 'right',
                    padding: '6px 8px', color: T.textFaint,
                    fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase',
                    borderBottom: `1px solid ${T.border}`, fontWeight: 400,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(m => {
                const net = (m.income || 0) - (m.expense || 0);
                return (
                  <tr key={`${m.year}-${m.month}`} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td style={{ padding: '9px 8px', color: T.textSecondary }}>{MONTHS[m.month - 1]} {m.year}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', color: T.accent }}>{fmt(m.income)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', color: T.warn }}>{fmt(m.expense)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', color: net >= 0 ? T.accent2 : T.warn }}>{fmtSgn(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      }
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: 'rgba(255,107,107,0.08)', border: `1px solid rgba(255,107,107,0.25)`,
      borderRadius: T.radiusLg, padding: '14px 20px', marginBottom: 24,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontFamily: T.fontMono, fontSize: '0.8rem', color: T.warn,
      animation: 'fadeUp 0.3s ease both',
    }}>
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontFamily: T.fontMono, fontSize: '0.72rem',
            background: 'rgba(255,107,107,0.12)', border: `1px solid rgba(255,107,107,0.3)`,
            color: T.warn, padding: '5px 14px', borderRadius: T.radiusMd,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          retry
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ height = 120 }) {
  return (
    <div style={{
      ...cardStyle({ height }),
      background: 'rgba(255,255,255,0.02)',
      animation: 'livePulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────
const EMPTY_FILTERS = { type: '', category: '', startDate: '', endDate: '' };

export default function DashboardPage() {
  useGlobalStyles();
  const { token } = useAuth();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [wide, setWide] = useState(typeof window !== 'undefined' ? window.innerWidth > 900 : true);
  useEffect(() => {
    const h = () => setWide(window.innerWidth > 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const load = useCallback(async (params) => {
    if (!token) { setError('Unauthorized: No token found'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.summary(token, params);
      setData(res);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => { load(EMPTY_FILTERS); }, [load]);

  const applyFilters = () => load(filters);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  };

  const expenseRatio = data?.totalIncome
    ? Math.round((data.totalExpense / data.totalIncome) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: T.bgBase, color: T.textPrimary, fontFamily: T.fontSans }}>
      <Topbar loading={loading} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: wide ? '28px 28px 60px' : '20px 16px 48px' }}>

        {error && <ErrorBanner message={error} onRetry={() => load(filters)} />}

        {/* ── Filters ── */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
          loading={loading}
        />

        {/* ── KPIs ── */}
        <SectionLabel>overview</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(3,1fr)' : '1fr', gap: 16, marginBottom: 28 }}>
          {!data ? (
            [0,1,2].map(i => <SkeletonCard key={i} height={130} />)
          ) : (
            <>
              <KpiCard label="total income"   icon="↑" value={fmt(data.totalIncome)}  sub="this period"             accentColor={T.accent}  delay={0.05} />
              <KpiCard label="total expenses" icon="↓" value={fmt(data.totalExpense)} sub={`${expenseRatio}% of income`} accentColor={T.warn}    delay={0.10} />
              <KpiCard label="net balance"    icon="≈" value={fmtSgn(data.netBalance)} sub="income − expenses"      accentColor={T.accent2} delay={0.15} />
            </>
          )}
        </div>

        {/* ── Trend chart ── */}
        <SectionLabel>monthly trends</SectionLabel>
        {!data
          ? <SkeletonCard height={310} />
          : <TrendChart trends={data.monthlyTrends || []} />
        }

        {/* ── Activity + Categories ── */}
        <SectionLabel>breakdown &amp; activity</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 28 }}>
          {!data ? (
            [0,1].map(i => <SkeletonCard key={i} height={320} />)
          ) : (
            <>
              <ActivityCard records={data.recentActivity || []} meta={data.recentMeta || {}} />
              <CategoryCard categories={data.categoryTotals || []} />
            </>
          )}
        </div>

        {/* ── Monthly detail ── */}
        <SectionLabel>monthly detail</SectionLabel>
        {!data
          ? <SkeletonCard height={240} />
          : <MonthlyList trends={data.monthlyTrends || []} />
        }

      </div>
    </div>
  );
}