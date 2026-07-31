import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';
import './Maintenance.css';

const Maintenance = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-card">
        <div className="maintenance-icon-wrapper">
          <ServerCrash size={80} />
        </div>
        <h1 className="maintenance-title">Servicio No Disponible</h1>
        <p className="maintenance-text">
          El sistema está experimentando problemas de conexión o se encuentra en mantenimiento programado. 
          Por favor, intenta de nuevo más tarde o ponte en contacto con el administrador del sistema.
        </p>
        <button 
          className="maintenance-btn"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={20} />
          Intentar conectar de nuevo
        </button>
      </div>
    </div>
  );
};

export default Maintenance;
