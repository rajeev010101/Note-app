import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { api, authHeaders } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Notes() {
  const [notes, setNotes] = useState([]); const [draft, setDraft] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const { token, logout } = useAuth(); const navigate = useNavigate();
  const load = useCallback(async () => { setLoading(true); setError(''); try { setNotes(await api('/notes', { headers: authHeaders(token) })); } catch (err) { if (/not authorized/i.test(err.message)) { logout(); navigate('/login'); } else setError(err.message); } finally { setLoading(false); } }, [token, logout, navigate]);
  useEffect(() => { load(); }, [load]);
  const create = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { const note = await api('/notes', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(draft) }); setNotes((items) => [note, ...items]); setDraft({ title: '', content: '' }); navigate(`/notes/${note._id}`); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  return <main className="page"><div className="page-head"><div><p className="eyebrow">Personal notes</p><h1>Make room for good ideas.</h1><p className="muted">Capture it now, refine it later, share it only when you choose.</p></div><button className="button ghost" title="Refresh notes" onClick={load}><FiRefreshCw /> Refresh</button></div>{error && <p className="alert">{error}</p>}<div className="notes-layout"><section className="panel"><h2>New note</h2><form className="form-stack" onSubmit={create}><label>Title<input required maxLength="160" placeholder="A useful title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Thoughts<textarea required placeholder="Write without interruption..." value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label><button className="button" disabled={saving}>{saving ? 'Creating...' : <><FiPlus /> Create note</>}</button></form></section><section><h2>{loading ? 'Loading notes...' : `${notes.length} note${notes.length === 1 ? '' : 's'}`}</h2>{!loading && notes.length === 0 && <div className="panel empty"><FiFileText size={28} /><p>Your first note is waiting for you.</p></div>}<div className="note-list">{notes.map((note) => <button className="note-row" key={note._id} onClick={() => navigate(`/notes/${note._id}`)}><h3>{note.title}</h3><p>{note.content}</p><div className="note-meta">Updated {new Date(note.updatedAt).toLocaleDateString()}</div></button>)}</div></section></div></main>;
}
