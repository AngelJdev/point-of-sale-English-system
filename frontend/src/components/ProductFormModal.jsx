import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import './ProductFormModal.css';

const ProductFormModal = ({ isOpen, onClose, onProductAdded, productToEdit }) => {
  const [formData, setFormData] = useState({
    codigo_interno: '',
    nombre: '',
    marca: '',
    ubicacion_fisica: '',
    precio_publico: '',
    stock_actual: '',
    stock_minimo: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          codigo_interno: productToEdit.codigo_interno || '',
          nombre: productToEdit.nombre || '',
          marca: productToEdit.marca || '',
          ubicacion_fisica: productToEdit.ubicacion_fisica || '',
          imageUrl: productToEdit.imageUrl || '',
          precio_publico: productToEdit.precio_publico || '',
          stock_actual: productToEdit.stock_actual || '',
          stock_minimo: productToEdit.stock_minimo || ''
        });
      } else {
        setFormData({
          codigo_interno: '', nombre: '', marca: '', ubicacion_fisica: '', imageUrl: '', precio_publico: '', stock_actual: '', stock_minimo: ''
        });
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Convertir strings a numéricos para los campos matemáticos
      const payload = {
        ...formData,
        precio_publico: Number(formData.precio_publico),
        stock_actual: Number(formData.stock_actual),
        stock_minimo: Number(formData.stock_minimo || 0)
      };

      if (productToEdit) {
        await axios.put(`/products/${productToEdit._id}`, payload);
        toast.success('Producto actualizado');
      } else {
        await axios.post('/products', payload);
        toast.success('Producto agregado');
      }
      
      // Limpiar y notificar éxito
      setFormData({
        codigo_interno: '', nombre: '', marca: '', ubicacion_fisica: '', imageUrl: '', precio_publico: '', stock_actual: '', stock_minimo: ''
      });
      onProductAdded(); // Refresca la tabla del inventario
      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error al guardar producto:", error);
      const serverMessage = error.response?.data?.message || "";
      const errorStr = error.response?.data?.error || "";
      
      // El código 11000 de MongoDB representa "Duplicate Key"
      if (errorStr.includes('11000') || serverMessage.includes('11000') || errorStr.includes('E11000')) {
        toast.error("Este código ya existe");
      } else {
        toast.error(serverMessage || "Error al guardar el producto");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-form-content">
        <div className="modal-header">
          <h2>{productToEdit ? 'Editar Refacción' : 'Agregar Nueva Refacción'}</h2>
          <button className="close-btn" onClick={onClose}><X size={32} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Código Interno / Escáner *</label>
            <input 
              type="text" name="codigo_interno" required 
              value={formData.codigo_interno} onChange={handleChange} 
              placeholder="Ej. BAL-001 o escanea el código" 
            />
          </div>
          
          <div className="form-group">
            <label>Descripción del Producto *</label>
            <input 
              type="text" name="nombre" required 
              value={formData.nombre} onChange={handleChange} 
              placeholder="Ej. Balatas Delanteras Cerámicas" 
            />
          </div>
          
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="form-group">
              <label>Marca (Opcional)</label>
              <input 
                type="text" name="marca" 
                value={formData.marca} onChange={handleChange} 
                placeholder="Ej. TRW, Bosch" 
              />
            </div>

            <div className="form-group">
              <label>Ubicación Física</label>
              <input 
                type="text" name="ubicacion_fisica" 
                value={formData.ubicacion_fisica} onChange={handleChange} 
                placeholder="Ej. Pasillo 3, Estante B" 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>URL de Fotografía (Opcional)</label>
            <input 
              type="text" name="imageUrl" 
              value={formData.imageUrl} onChange={handleChange} 
              placeholder="Ej. https://misitio.com/foto.jpg" 
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Precio Venta ($) *</label>
              <input 
                type="number" step="0.01" name="precio_publico" required min="0" 
                value={formData.precio_publico} onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Stock Físico *</label>
              <input 
                type="number" name="stock_actual" required min="0" 
                value={formData.stock_actual} onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Alerta Mínima</label>
              <input 
                type="number" name="stock_minimo" min="0" 
                value={formData.stock_minimo} onChange={handleChange} 
                placeholder="Avisar en..."
              />
            </div>
          </div>
          
          <div className="form-actions">
            <div className="form-buttons">
              <button type="button" className="btn-cancelar" onClick={onClose} disabled={isSaving}>Cancelar</button>
              <button type="submit" className="btn-guardar" disabled={isSaving}>
                {isSaving ? 'Guardando...' : (productToEdit ? 'Guardar Cambios' : 'Guardar Producto')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
