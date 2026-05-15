import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, PackageSearch, Users, BarChart3, Settings, ShieldAlert, LogOut, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const isPrivileged = currentUser?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Punto de Venta</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-btn ${location.pathname === '/' ? 'active' : ''}`}>
          <ShoppingCart size={32} />
          <span>Venta</span>
        </Link>
        <Link to="/inventory" className={`sidebar-btn ${location.pathname === '/inventory' ? 'active' : ''}`}>
          <PackageSearch size={32} />
          <span>Productos</span>
        </Link>
        
        {isPrivileged && (
          <>
            <Link to="/users" className={`sidebar-btn ${location.pathname === '/users' ? 'active' : ''}`}>
              <ShieldAlert size={32} />
              <span>Usuarios</span>
            </Link>
            <Link to="/reports" className={`sidebar-btn ${location.pathname === '/reports' ? 'active' : ''}`}>
              <BarChart3 size={32} />
              <span>Reportes</span>
            </Link>
            <Link to="/history" className={`sidebar-btn ${location.pathname === '/history' ? 'active' : ''}`}>
              <History size={32} />
              <span>Historial</span>
            </Link>
          </>
        )}
        
        <button className="sidebar-btn disabled">
          <Users size={32} />
          <span>Clientes</span>
        </button>
        <button className="sidebar-btn disabled">
          <Settings size={32} />
          <span>Config.</span>
        </button>
      </nav>
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLogout} className="sidebar-btn" style={{ width: '100%', color: '#fca5a5' }}>
          <LogOut size={32} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
