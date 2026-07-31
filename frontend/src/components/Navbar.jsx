import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, PackageSearch, BarChart3 } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Refaccionaria Reyna</h1>
      </div>
      <div className="navbar-links">
        <Link 
          to="/" 
          className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
        >
          <ShoppingCart size={28} />
          <span>Ventas</span>
        </Link>
        <Link 
          to="/inventory" 
          className={`nav-btn ${location.pathname === '/inventory' ? 'active' : ''}`}
        >
          <PackageSearch size={28} />
          <span>Inventario</span>
        </Link>
        <Link 
          to="/reports" 
          className={`nav-btn ${location.pathname === '/reports' ? 'active' : ''}`}
        >
          <BarChart3 size={28} />
          <span>Reportes</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
