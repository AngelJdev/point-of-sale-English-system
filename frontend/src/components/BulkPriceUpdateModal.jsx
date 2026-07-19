import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import { X, Loader2, AlertCircle } from 'lucide-react';

const BulkPriceUpdateModal = ({ isOpen, onClose, onPricesUpdated }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [filters, setFilters] = useState({
    proveedor: '',
    linea_producto: '',
    marca: ''
  });

  const [updateConfig, setUpdateConfig] = useState({
    operation: 'increase', // 'increase' | 'decrease'
    increaseType: 'percentage', // 'percentage' | 'fixed'
    increaseValue: '',
    applyTo: ['publico', 'costo', 'taller'] // Default to all 3
  });

  // Fetch suppliers on open
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('/suppliers');
        setSuppliers(response.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setUpdateConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setUpdateConfig(prev => {
      const newApplyTo = checked 
        ? [...prev.applyTo, value]
        : prev.applyTo.filter(item => item !== value);
      return { ...prev, applyTo: newApplyTo };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!filters.proveedor && !filters.linea_producto && !filters.marca) {
      toast.error('Debes seleccionar al menos un filtro (Proveedor, Línea o Marca)');
      return;
    }

    if (!updateConfig.increaseValue || Number(updateConfig.increaseValue) <= 0) {
      toast.error('El valor debe ser mayor a cero');
      return;
    }

    if (updateConfig.applyTo.length === 0) {
      toast.error('Debes seleccionar al menos un precio para actualizar');
      return;
    }

    setIsSaving(true);
    try {
      let finalValue = Number(updateConfig.increaseValue);
      if (updateConfig.operation === 'decrease') {
        finalValue = -Math.abs(finalValue);
      } else {
        finalValue = Math.abs(finalValue);
      }

      const payload = {
        ...filters,
        increaseType: updateConfig.increaseType,
        applyTo: updateConfig.applyTo,
        increaseValue: finalValue
      };

      const response = await axios.put('/products/bulk/update-prices', payload);
      toast.success(response.data.message || 'Precios actualizados masivamente');
      onPricesUpdated(); // Refresh table
      onClose();
    } catch (error) {
      console.error('Error actualizando precios masivamente:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar precios');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSupplierObj = suppliers.find(s => s._id === filters.proveedor);
  const availableLines = selectedSupplierObj?.lineas_disponibles || [];

  return (
    <div className="modal-overlay">
      <div className="modal-form-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>ACTUALIZAR PRECIOS</h2>
          <button className="close-btn" onClick={onClose}><X size={32} /></button>
        </div>

        <form onSubmit={handleSubmit} className="product-form" style={{ padding: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle color="#16a34a" size={24} style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>
              Utiliza esta herramienta para aumentar o reducir los precios de varios productos a la vez. 
              <strong> Primero filtra</strong> a qué productos quieres aplicar el cambio, y luego define el <strong>aumento</strong>.
            </p>
          </div>

          <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>1. Selecciona los productos a afectar (Filtros)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Proveedor</label>
              <select name="proveedor" value={filters.proveedor} onChange={handleFilterChange}>
                <option value="">-- Todos los Proveedores --</option>
                {suppliers.map(sup => (
                  <option key={sup._id} value={sup._id}>{sup.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Línea de Producto / Categoría</label>
              {availableLines.length > 0 ? (
                <select name="linea_producto" value={filters.linea_producto} onChange={handleFilterChange}>
                  <option value="">-- Todas las Líneas --</option>
                  {availableLines.map((linea, idx) => (
                    <option key={idx} value={linea}>{linea}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" name="linea_producto" value={filters.linea_producto} onChange={handleFilterChange}
                  placeholder="Ej. Aceites, Frenos (Coincidencia exacta)" 
                />
              )}
            </div>
            <div className="form-group">
              <label>Marca</label>
              <input 
                type="text" name="marca" value={filters.marca} onChange={handleFilterChange}
                placeholder="Ej. TRW, Bosch" 
              />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0', fontSize: '1.1rem' }}>2. Configura el Cambio</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Operación</label>
              <select name="operation" value={updateConfig.operation} onChange={handleConfigChange}>
                <option value="increase">Aumento (Subir precio)</option>
                <option value="decrease">Descuento (Bajar precio)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Valor</label>
              <select name="increaseType" value={updateConfig.increaseType} onChange={handleConfigChange}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Pesos (MXN)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Valor ({updateConfig.increaseType === 'percentage' ? '%' : '$'})</label>
              <input 
                type="number" step="0.01" name="increaseValue" required min="0"
                value={updateConfig.increaseValue} onChange={handleConfigChange}
                placeholder={updateConfig.increaseType === 'percentage' ? 'Ej. 10' : 'Ej. 20'} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ marginBottom: '1rem', display: 'block', fontSize: '1.05rem', fontWeight: '600' }}>¿A qué precios aplicar el cambio?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              
              <label style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', 
                padding: '1rem', border: `2px solid ${updateConfig.applyTo.includes('costo') ? 'var(--primary-color)' : '#e2e8f0'}`, 
                borderRadius: '12px', background: updateConfig.applyTo.includes('costo') ? 'rgba(99, 102, 241, 0.05)' : '#fff',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" value="costo" 
                  checked={updateConfig.applyTo.includes('costo')} 
                  onChange={handleCheckboxChange} 
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Precio de Compra</span>
              </label>

              <label style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', 
                padding: '1rem', border: `2px solid ${updateConfig.applyTo.includes('publico') ? 'var(--primary-color)' : '#e2e8f0'}`, 
                borderRadius: '12px', background: updateConfig.applyTo.includes('publico') ? 'rgba(99, 102, 241, 0.05)' : '#fff',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" value="publico" 
                  checked={updateConfig.applyTo.includes('publico')} 
                  onChange={handleCheckboxChange} 
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Precio Público</span>
              </label>

              <label style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', 
                padding: '1rem', border: `2px solid ${updateConfig.applyTo.includes('taller') ? 'var(--primary-color)' : '#e2e8f0'}`, 
                borderRadius: '12px', background: updateConfig.applyTo.includes('taller') ? 'rgba(99, 102, 241, 0.05)' : '#fff',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" value="taller" 
                  checked={updateConfig.applyTo.includes('taller')} 
                  onChange={handleCheckboxChange} 
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Precio Especial</span>
              </label>

            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <div className="form-buttons">
              <button type="button" className="btn-cancelar" onClick={onClose} disabled={isSaving}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={isSaving}>
                {isSaving
                  ? <><Loader2 size={18} className="btn-spinner" /> Procesando...</>
                  : 'Aplicar Actualización'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkPriceUpdateModal;
