import React, { useState, useEffect, useRef } from 'react';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import { X, ImagePlus, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import './ProductFormModal.css';

const EMPTY_FORM = {
  codigo_interno:  '',
  nombre:          '',
  marca:           '',
  ubicacion_fisica:'',
  precio_publico:  '',
  stock_actual:    '',
  stock_minimo:    '',
};

const ProductFormModal = ({ isOpen, onClose, onProductAdded, productToEdit }) => {
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [imageFile, setImageFile]   = useState(null);       // File object del input
  const [imagePreview, setImagePreview] = useState('');     // Data URL para previsualizar
  const [existingUrl, setExistingUrl]   = useState('');     // URL guardada en Cloudinary (modo edición)
  const [removeImage, setRemoveImage]   = useState(false);  // Señal de borrar imagen actual
  const [isSaving, setIsSaving]     = useState(false);
  const fileInputRef = useRef(null);

  // ── Resetea el formulario cada vez que se abre ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setFormData({
        codigo_interno:   productToEdit.codigo_interno   || '',
        nombre:           productToEdit.nombre           || '',
        marca:            productToEdit.marca            || '',
        ubicacion_fisica: productToEdit.ubicacion_fisica || '',
        precio_publico:   productToEdit.precio_publico   || '',
        stock_actual:     productToEdit.stock_actual     || '',
        stock_minimo:     productToEdit.stock_minimo     || '',
      });
      setExistingUrl(productToEdit.imageUrl || '');
    } else {
      setFormData(EMPTY_FORM);
      setExistingUrl('');
    }

    // Limpia imagen local en ambos casos
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  // ── Manejo de campos de texto ───────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Selección de imagen: genera preview local ───────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5 MB');
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Quitar imagen seleccionada / existente ──────────────────────────────
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(true);          // Le dice al backend que borre la imagen anterior
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Envío del formulario usando FormData ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // FormData agrupa texto + archivo en una sola petición multipart/form-data
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));

      if (imageFile) {
        // Nuevo archivo: multer+Cloudinary lo procesa en el backend
        data.append('imagen', imageFile);
      } else if (removeImage) {
        // El usuario quitó la imagen actual → le avisamos al backend
        data.append('removeImage', 'true');
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (productToEdit) {
        await axios.put(`/products/${productToEdit._id}`, data, config);
        toast.success('Producto actualizado');
      } else {
        await axios.post('/products', data, config);
        toast.success('Producto agregado al inventario');
      }

      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      const serverMessage = error.response?.data?.message || '';
      const errorStr      = error.response?.data?.error   || '';

      if (errorStr.includes('11000') || serverMessage.includes('11000') || errorStr.includes('E11000')) {
        toast.error('Este código interno ya existe');
      } else {
        toast.error(serverMessage || 'Error al guardar el producto');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Imagen a mostrar en el preview ─────────────────────────────────────
  const previewSrc = imagePreview || (!removeImage ? existingUrl : '');

  return (
    <div className="modal-overlay">
      <div className="modal-form-content">
        <div className="modal-header">
          <h2>{productToEdit ? 'Editar Refacción' : 'Agregar Nueva Refacción'}</h2>
          <button className="close-btn" onClick={onClose}><X size={32} /></button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">

          {/* ── Fila 1: Código + Nombre ────────────────────────────────── */}
          <div className="form-row">
            <div className="form-group">
              <label>Código Interno / Escáner *</label>
              <input
                type="text" name="codigo_interno" required
                value={formData.codigo_interno} onChange={handleChange}
                placeholder="Ej. BAL-001"
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
          </div>

          {/* ── Fila 2: Marca + Ubicación ──────────────────────────────── */}
          <div className="form-row">
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

          {/* ── Fotografía: upload real a Cloudinary ───────────────────── */}
          <div className="form-group">
            <label>Fotografía de la Refacción</label>
            <div className="image-upload-area">
              {previewSrc ? (
                /* Preview de la imagen seleccionada o existente */
                <div className="image-preview-wrapper">
                  <img src={previewSrc} alt="Vista previa" className="image-preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                    title="Quitar imagen"
                  >
                    <Trash2 size={18} />
                  </button>
                  {imageFile && (
                    <span className="image-new-badge">
                      <CheckCircle2 size={14} /> Nueva imagen lista
                    </span>
                  )}
                </div>
              ) : (
                /* Zona de clic para seleccionar archivo */
                <button
                  type="button"
                  className="image-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={36} />
                  <span>Seleccionar foto</span>
                  <small>JPG, PNG, WebP · Máx. 5 MB</small>
                </button>
              )}

              {/* Input oculto ─ accedido por ref */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              {/* Botón "cambiar" cuando ya hay preview */}
              {previewSrc && (
                <button
                  type="button"
                  className="change-image-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar foto
                </button>
              )}
            </div>
          </div>

          {/* ── Fila 3: Precio + Stock actual + Stock mínimo ──────────── */}
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

          {/* ── Acciones ───────────────────────────────────────────────── */}
          <div className="form-actions">
            <div className="form-buttons">
              <button type="button" className="btn-cancelar" onClick={onClose} disabled={isSaving}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={isSaving}>
                {isSaving
                  ? <><Loader2 size={18} className="btn-spinner" /> Guardando...</>
                  : (productToEdit ? 'Guardar Cambios' : 'Guardar Producto')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
