import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, PackageSearch, Users, BarChart3, Settings, ShieldAlert, LogOut, History, Wallet, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const isPrivileged = currentUser?.role === 'admin';

  const [theme, setTheme] = React.useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    setIsExiting(true);
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 800);
  };

  return (
    <>
      {isExiting && <div className="bubble-overlay bubble-expand"></div>}
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
        <Link to="/cash" className={`sidebar-btn ${location.pathname === '/cash' ? 'active' : ''}`}>
          <Wallet size={32} />
          <span>Caja Chica</span>
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
        
        <Link to="/clients" className={`sidebar-btn ${location.pathname === '/clients' ? 'active' : ''}`}>
          <Users size={32} />
          <span>Clientes</span>
        </Link>
        {isPrivileged && (
          <Link to="/suppliers" className={`sidebar-btn ${location.pathname === '/suppliers' ? 'active' : ''}`}>
            <PackageSearch size={32} />
            <span>Proveedores</span>
          </Link>
        )}
        <Link to="/settings" className={`sidebar-btn ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={32} />
          <span>Config.</span>
        </Link>
      </nav>
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={toggleTheme} className="sidebar-btn" style={{ width: '100%', marginBottom: '0.5rem' }}>
          {theme === 'light' ? <Moon size={32} /> : <Sun size={32} />}
          <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-btn" style={{ width: '100%', color: '#fca5a5' }}>
          <LogOut size={32} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
