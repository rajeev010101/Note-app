import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEdit3 } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) }); login(data.token); navigate('/notes'); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return <main className="auth-page"><section className="auth-card panel"><div className="eyebrow"><FiEdit3 /> Your clear space</div><h1>Create your workspace</h1><p className="muted">Start writing in less than a minute.</p>{error && <p className="alert">{error}</p>}<form className="form-stack" onSubmit={submit}><label>Name<input required minLength="2" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" minLength="6" required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="button" disabled={loading}>{loading ? 'Creating...' : <>Create account <FiArrowRight /></>}</button></form><p className="auth-footer">Already a member? <Link className="text-link" to="/login">Sign in</Link></p></section></main>;
}
