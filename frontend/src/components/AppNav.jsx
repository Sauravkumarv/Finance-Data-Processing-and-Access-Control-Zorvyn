import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import './AppNav.css';

function LiveDot() {
  return <span className="app-nav__live-dot" aria-hidden="true" />;
}

function Spinner() {
  return <span className="app-nav__spinner" aria-hidden="true" />;
}

const getLinkClassName = ({ isActive }) =>
  `app-nav__link${isActive ? ' is-active' : ''}`;

export default function AppNav({ busy = false, statusLabel = 'live' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <NavLink to="/dashboard" className="app-nav__brand">
        ledger<span className="app-nav__brand-secondary">view</span>
      </NavLink>

      <div className="app-nav__links">
        <NavLink to="/dashboard" className={getLinkClassName}>
          Dashboard
        </NavLink>
        <NavLink to="/records" className={getLinkClassName}>
          Records
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/users" className={getLinkClassName}>
            Users
          </NavLink>
        )}
      </div>

      <div className="app-nav__meta">
        <div className="app-nav__status">
          {busy ? <Spinner /> : <LiveDot />}
          <span>{statusLabel}</span>
        </div>

        <button className="app-nav__logout" type="button" onClick={handleLogout}>
          Logout{user?.role ? ` (${user.role})` : ''}
        </button>
      </div>
    </nav>
  );
}
