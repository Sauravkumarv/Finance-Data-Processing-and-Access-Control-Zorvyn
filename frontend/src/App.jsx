import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import UsersPage from './pages/UsersPage';

const Protected = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default function App() {
  return (
    <div className="app">
      <main className="app-content">
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
