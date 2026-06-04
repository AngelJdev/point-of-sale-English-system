import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { currentUser } = useAuth();
  const token = currentUser?.token;

  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phone: '',
    receiptMessage: '',
    taxRate: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para el manual de ayuda interactivo (Acordeón)
  const [activeManualSection, setActiveManualSection] = useState(null);

  const toggleManualSection = (index) => {
    setActiveManualSection(activeManualSection === index ? null : index);
  };

  const manualContent = [
    {
      title: '📦 ¿Cómo gestionar el Inventario?',
      content: 'Ve a la sección "Productos" desde el menú lateral. Haz clic en "Nuevo Producto" para registrar mercancía. Puedes asignar el precio de compra, precio de venta y el stock inicial. Si el stock se acerca a cero, aparecerá remarcado para que sepas que debes resurtir.'
    },
    {
      title: '🛒 ¿Cómo registrar una Venta?',
      content: 'En la sección "Venta", busca los productos usando la barra de búsqueda o el atajo [F2]. Haz clic en los productos para agregarlos al carrito. Cuando estés listo, selecciona si el pago será en Efectivo, Tarjeta o a Crédito, y presiona el botón "Cobrar" o usa [F4].'
    },
    {
      title: '👥 ¿Cómo dar Crédito a Clientes?',
      content: 'Primero, ve a "Clientes" y registra uno nuevo. Marca la casilla "Habilitar Crédito" e ingresa el límite máximo que le permitirás deber. Al cobrar en el Punto de Venta, selecciona al cliente en el menú desplegable y usa el botón "Crédito". Para registrar abonos, ve a "Clientes" y haz clic en "Abonar".'
    },
    {
      title: '🚚 ¿Cómo llevar el control de Proveedores?',
      content: 'En la sección "Proveedores", puedes registrar las empresas que te surten. Al llegar mercancía nueva, haz clic en "Registrar Factura" para aumentar tu deuda con ellos. Cuando les realices un pago o transferencia, haz clic en "Pagar" para descontarlo de tu deuda total.'
    },
    {
      title: '💵 ¿Cómo funciona la Caja Chica?',
      content: 'Ve a "Caja Chica" para registrar dinero que entra o sale de tu caja que no corresponde a ventas (ej. pagar el agua, sacar dinero para cambio). Debes "Abrir Turno" con un fondo inicial, y al final del día puedes "Cerrar Turno" para que se envíe el historial.'
    },
    {
      title: '📊 ¿Dónde veo mis Reportes y Corte de Caja?',
      content: 'Si eres administrador, puedes ir a "Historial" para ver cada ticket de venta realizado o a "Reportes" para visualizar el total de ingresos. El Corte del Día se realiza automáticamente tomando las ventas del turno.'
    }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            storeName: data.storeName || '',
            address: data.address || '',
            phone: data.phone || '',
            receiptMessage: data.receiptMessage || '',
            taxRate: data.taxRate || 0
          });
        }
      } catch (error) {
        toast.error('Error al cargar configuración');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchSettings();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Configuración guardada correctamente');
        // Aquí podrías actualizar un contexto global si el storeName se usa en el Navbar o Receipt
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de red al guardar');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', color: 'var(--text-color)' }}>Cargando configuración...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1><SettingsIcon size={32} /> Configuración del Sistema</h1>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Nombre del Negocio</label>
            <input type="text" name="storeName" value={formData.storeName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Mensaje de Agradecimiento (Ticket)</label>
            <textarea name="receiptMessage" value={formData.receiptMessage} onChange={handleChange} rows="3" />
          </div>
          <div className="form-group">
            <label>Impuesto IVA (%)</label>
            <input type="number" name="taxRate" value={formData.taxRate} onChange={handleChange} min="0" step="0.1" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save-settings">
              <Save size={20} /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      <div className="settings-header" style={{ marginTop: '3rem' }}>
        <h2><HelpCircle size={28} /> Manual de Ayuda del Sistema</h2>
      </div>

      <div className="help-manual-container">
        {manualContent.map((section, index) => (
          <div key={index} className="manual-section">
            <button 
              className={`manual-header ${activeManualSection === index ? 'active' : ''}`}
              onClick={() => toggleManualSection(index)}
            >
              <span className="manual-title">{section.title}</span>
              {activeManualSection === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            
            {activeManualSection === index && (
              <div className="manual-body">
                <p>{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
