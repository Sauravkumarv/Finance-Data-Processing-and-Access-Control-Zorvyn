import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import UsersPage from './pages/UsersPage';

const NavBar = () => {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="logo">Finance Dashboard</div>
      <nav>
        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/records">Records</Link>
            {user.role === 'admin' && <Link to="/users">Users</Link>}
          </>
        )}
      </nav>
      <div>
        {user ? (
          <button className="link-btn" onClick={logout}>Logout ({user.role})</button>
        ) : (
          <Link to="/auth">Login</Link>
        )}
      </div>
    </header>
  );
};

const Protected = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main className="content">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/records"
            element={
              <Protected>
                <RecordsPage />
              </Protected>
            }
          />
          <Route
            path="/users"
            element={
              <Protected>
                <UsersPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}