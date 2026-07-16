import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { FiBookOpen, FiLogOut } from 'react-icons/fi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Notes from './pages/Notes';
import NoteView from './pages/NoteView';
import Share from './pages/Share';
import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppFrame() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  return <div className="app-shell">
    {isAuthenticated && <header className="topbar"><Link to="/notes" className="brand"><FiBookOpen /> Noted</Link><button className="icon-button" title="Sign out" onClick={() => { logout(); navigate('/login'); }}><FiLogOut /></button></header>}
    <Routes>
      <Route path="/" element={<Navigate to="/notes" replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/notes" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/notes" replace /> : <Register />} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/notes/:id" element={<ProtectedRoute><NoteView /></ProtectedRoute>} />
      <Route path="/share/:token" element={<Share />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppFrame /></BrowserRouter></AuthProvider>;
}
