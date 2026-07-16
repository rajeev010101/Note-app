import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiLock, FiUnlock } from 'react-icons/fi';
import { api } from '../api';

export default function Share() {
  const { token } = useParams(); const [note, setNote] = useState(null); const [requiresPassword, setRequiresPassword] = useState(false); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let active = true; api(`/share/${token}`).then((data) => { if (!active) return; setRequiresPassword(Boolean(data.requiresPassword)); setNote(data.note || null); }).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [token]);
  const unlock = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const data = await api(`/share/${token}`, { method: 'POST', body: JSON.stringify({ password }) }); setNote(data.note); setRequiresPassword(false); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  if (loading) return <main className="share-page"><p className="muted">Opening secure note...</p></main>;
  if (error && !requiresPassword) return <main className="center-card"><section className="panel"><FiLock size={28} /><h1>Link unavailable</h1><p className="muted">{error}</p></section></main>;
  if (requiresPassword) return <main className="center-card"><section className="panel"><FiLock size={28} /><h1>Protected note</h1><p className="muted">Enter the password shared with you to reveal this note.</p>{error && <p className="alert">{error}</p>}<form className="form-stack" onSubmit={unlock}><label>Password<input autoFocus type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="button">Unlock note <FiUnlock /></button></form></section></main>;
  return <main className="share-page"><p className="eyebrow">Shared securely</p><section className="panel"><h1>{note.title}</h1><p className="muted">Opened via a secure link</p><article className="note-content shared-note">{note.content}</article></section></main>;
}
