import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PackageSearch, User, KeyRound } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !password) {
      toast.error('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(usuario, password);
      toast.success(`Bienvenido al sistema ${userData?.nombre || ''}`);
      
      // Activar pantalla de carga "premium"
      setIsSuccess(true);
      
      // Dar unos segundos de carga antes de entrar
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      toast.error('Usuario o contraseña incorrectos. Intente de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {isSuccess && (
        <div className="login-success-overlay">
          <div className="loader-container">
            <PackageSearch size={100} className="floating-logo" />
            <h2>Iniciando sistema...</h2>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      )}
      <div className="login-card">
        <div className="login-header">
          <PackageSearch size={64} color="var(--primary-color)" />
          <h1>Punto de Venta</h1>
          <p>Sistema Integral de Refaccionaria</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Usuario</label>
            <div className="input-icon-wrapper">
              <User size={24} className="input-icon" />
              <input 
                type="text" 
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                placeholder="Ingresa tu nombre de usuario"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-icon-wrapper">
              <KeyRound size={24} className="input-icon" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu contraseña"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
