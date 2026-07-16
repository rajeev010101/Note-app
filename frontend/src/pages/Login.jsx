import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLock } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) }); login(data.token); navigate('/notes'); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return <main className="auth-page"><section className="auth-card panel"><div className="eyebrow"><FiLock /> Private workspace</div><h1>Welcome back</h1><p className="muted">Sign in to keep your notes moving.</p>{error && <p className="alert">{error}</p>}<form className="form-stack" onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" autoComplete="current-password" minLength="6" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="button" disabled={loading}>{loading ? 'Signing in...' : <>Sign in <FiArrowRight /></>}</button></form><p className="auth-footer">New here? <Link className="text-link" to="/register">Create an account</Link></p></section></main>;
}
