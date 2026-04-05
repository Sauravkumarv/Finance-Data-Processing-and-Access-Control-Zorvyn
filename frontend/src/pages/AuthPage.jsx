import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../state/AuthContext';
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";

export default function AuthPage() {
  const { setToken } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const[loading,setLoading]=useState()
  const navigate = useNavigate();

  // 🔥 VALIDATION FUNCTION
  const validateForm = () => {
    // Name validation (only for register)
    if (mode === 'register') {
      if (!form.name.trim()) {
        return "Name is required";
      }
      if (form.name.length < 3) {
        return "Name must be at least 3 characters";
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      return "Email is required";
    }
    if (!emailRegex.test(form.email)) {
      return "Invalid email format";
    }

    // Password validation
    if (!form.password) {
      return "Password is required";
    }
    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    
    return null; // no error
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // 🔥 VALIDATION CHECK
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === 'register') {
        await api.register(form);
        setMode('login');
      }

      const res = await api.login({
        email: form.email,
        password: form.password
      });

      setToken(res.token);
      navigate("/dashboard");

    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="card auth-card">
      <div className="switcher">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
      </div>

      <form onSubmit={submit}>
        {mode === 'register' && (
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
        {loading ? (
      <ClipLoader size={20} color="#fff" />
        ) : (
    mode === 'login' ? 'Login' : 'Register + Login'
     )}
</button>
      </form>

      <p className="hint">Use(admin@gmail.com & 123456) as dummy account.</p>
    </div>
  );
}
