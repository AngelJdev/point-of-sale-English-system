import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PackageSearch, User, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
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
      toast.error(typeof err === 'string' ? err : 'Usuario o contraseña incorrectos. Intente de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {isSuccess && (
        <div className="bubble-overlay bubble-expand" style={{ pointerEvents: 'all' }}>
          <div className="loader-container">
            <PackageSearch size={100} className="floating-logo" />
            <h2>Iniciando sistema...</h2>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      )}
      {!isSuccess && <div className="bubble-overlay bubble-retract"></div>}

      <div className="login-split">
        {/* Lado Izquierdo - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="logo-glow">
              <PackageSearch size={80} color="white" />
            </div>
            <h1>Punto de Venta</h1>
            <p className="branding-subtitle">Sistema Integral de Administración y Control para Refaccionarias.</p>
            
            <div className="branding-features">
              <div className="feature-item">
                <ShieldCheck size={24} color="#60a5fa" />
                <span>Gestión Segura y Encriptada</span>
              </div>
            </div>
          </div>
          
          <div className="branding-footer">
            <p>&copy; 2026 Refaccionaria. Todos los derechos reservados.</p>
          </div>
        </div>

        {/* Lado Derecho - Formulario */}
        <div className="login-form-container">
          <div className="login-form-inner">
            <div className="mobile-header">
              <PackageSearch size={48} color="var(--primary-color)" />
              <h2>Bienvenido de nuevo</h2>
            </div>
            
            <div className="form-heading">
              <h2>Iniciar Sesión</h2>
              <p>Ingresa tus credenciales para acceder a tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="premium-login-form">
              <div className="input-group">
                <label>Nombre de Usuario</label>
                <div className="input-icon-wrapper">
                  <User size={22} className="input-icon" />
                  <input 
                    type="text" 
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    placeholder="Ej. admin"
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={22} className="input-icon" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Tu contraseña segura"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="premium-login-btn"
                disabled={loading}
              >
                <span>{loading ? 'Autenticando...' : 'Acceder al Sistema'}</span>
                {!loading && <ArrowRight size={20} className="btn-arrow" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
