import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Phone, Building2, Edit, DollarSign, X, Check, Search, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import axios from '../config/axios';
import './Suppliers.css';
import './Clients.css'; // Reutilizamos estilos del modal de clientes

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transaction State
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  const { currentUser } = useAuth();
  const token = currentUser?.token;

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    empresa: '',
    lineas_disponibles: ''
  });

  const fetchSuppliers = async () => {
    try {
      const { data } = await axios.get('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Error al cargar proveedores');
    }
  };

  useEffect(() => {
    if (token) {
      fetchSuppliers();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setFormData({
        nombre: supplier.nombre,
        contacto: supplier.contacto || '',
        telefono: supplier.telefono || '',
        empresa: supplier.empresa || '',
        lineas_disponibles: supplier.lineas_disponibles ? supplier.lineas_disponibles.join(', ') : ''
      });
    } else {
      setCurrentSupplier(null);
      setFormData({ nombre: '', contacto: '', telefono: '', empresa: '', lineas_disponibles: '' });
    }
    setIsModalOpen(true);
  };

  const openTransactionModal = (supplier, type) => {
    setCurrentSupplier(supplier);
    setTxAmount('');
    if (type === 'invoice') {
      setTxDesc('Factura de compra');
      setIsInvoiceModalOpen(true);
    } else {
      setTxDesc('Pago a cuenta');
      setIsPaymentModalOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lineas_disponibles: formData.lineas_disponibles
          .split(',')
          .map(l => l.trim())
          .filter(l => l.length > 0)
      };

      const url = currentSupplier 
        ? `/suppliers/${currentSupplier._id}`
        : `/suppliers`;

      if (currentSupplier) {
        await axios.put(url, payload);
        toast.success('Proveedor actualizado');
      } else {
        await axios.post(url, payload);
        toast.success('Proveedor creado');
      }
      
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error de red al guardar proveedor');
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    if (supplier.balanceOwed > 0) {
      Swal.fire('Error', 'No puedes eliminar un proveedor si tienes una deuda pendiente con él.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Estás a punto de eliminar a ${supplier.nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/suppliers/${supplier._id}`);
        toast.success('Proveedor eliminado');
        fetchSuppliers();
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar proveedor', 'error');
      }
    }
  };

  const handleTransaction = async (e, type) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    try {
      const endpoint = type === 'invoice' ? 'invoice' : 'pay';
      await axios.post(`/suppliers/${currentSupplier._id}/${endpoint}`, {
        amount: Number(txAmount),
        description: txDesc
      });

      toast.success(type === 'invoice' ? 'Factura registrada' : 'Pago registrado');
      setIsInvoiceModalOpen(false);
      setIsPaymentModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error de red');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.empresa && s.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1><PackageSearch size={32} /> Proveedores</h1>
        <button className="add-supplier-btn" onClick={() => openModal()}>
          <Plus size={20} /> Nuevo Proveedor
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Buscar proveedor o empresa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}
        />
        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
      </div>

      <div className="suppliers-grid">
        {filteredSuppliers.map(supplier => (
          <div key={supplier._id} className="supplier-card">
            <div className="supplier-card-header">
              <div className="supplier-title" style={{ flex: 1, paddingRight: '1rem' }}>
                <h3 style={{ margin: 0 }}>{supplier.nombre}</h3>
                {supplier.empresa && <div className="supplier-company"><Building2 size={14} style={{display:'inline', marginRight: 4}}/>{supplier.empresa}</div>}
              </div>
              <button 
                onClick={() => handleDeleteSupplier(supplier)} 
                style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.2s', flexShrink: 0 }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Eliminar Proveedor"
              >
                <Trash2 size={22} />
              </button>
            </div>
            
            <div className="supplier-info">
              {supplier.telefono && <p><Phone size={16} /> {supplier.telefono}</p>}
            </div>

            {supplier.lineas_disponibles && supplier.lineas_disponibles.length > 0 && (
              <div className="supplier-lines">
                {supplier.lineas_disponibles.map((linea, index) => (
                  <span key={index} className="supplier-line-badge">{linea}</span>
                ))}
              </div>
            )}

            <div className="supplier-balance">
              <span>Le debemos:</span>
              <span className={`balance-amount ${supplier.balanceOwed > 0 ? 'debt' : 'clear'}`}>
                ${supplier.balanceOwed.toFixed(2)}
              </span>
            </div>

            <div className="supplier-actions">
              <div className="row">
                <button className="btn-invoice" onClick={() => openTransactionModal(supplier, 'invoice')}>
                  <FileText size={16} /> Registrar Factura
                </button>
              </div>
              <div className="row">
                <button className="btn-edit" onClick={() => openModal(supplier)}>
                  <Edit size={16} /> Editar
                </button>
                <button className="btn-pay" onClick={() => openTransactionModal(supplier, 'pay')} disabled={supplier.balanceOwed <= 0}>
                  <DollarSign size={16} /> Pagar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar Proveedor */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content supplier-modal">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <Building2 size={28} style={{ color: 'var(--primary-color)' }} />
              {currentSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              <button className="close-btn" onClick={() => setIsModalOpen(false)} style={{ marginLeft: 'auto' }}><X size={24} /></button>
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required placeholder="Ej. Refaccionaria El Jetta" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Empresa</label>
                  <input type="text" name="empresa" value={formData.empresa} onChange={handleInputChange} placeholder="Ej. Grupo Jetta S.A. de C.V." />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Ej. 5512345678" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Contacto (Persona)</label>
                  <input type="text" name="contacto" value={formData.contacto} onChange={handleInputChange} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label>Líneas de Producto que Vende</label>
                  <input 
                    type="text" name="lineas_disponibles" 
                    value={formData.lineas_disponibles} onChange={handleInputChange} 
                    placeholder="Ej. Aceites, Filtros, Suspensión" 
                  />
                  <small className="lineas-hint" style={{ marginTop: '0.5rem', display: 'block' }}>Separa cada línea por coma (,)</small>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save"><Check size={18} style={{ marginRight: 5, verticalAlign: 'middle' }}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Factura / Deuda */}
      {isInvoiceModalOpen && currentSupplier && (
        <div className="modal-overlay">
          <div className="modal-content supplier-modal">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <FileText size={28} style={{ color: '#f59e0b' }} />
              Registrar Compra (Factura)
              <button className="close-btn" onClick={() => setIsInvoiceModalOpen(false)} style={{ marginLeft: 'auto' }}><X size={24} /></button>
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p>Proveedor: <strong>{currentSupplier.nombre}</strong></p>
              <p>Al registrar, esto aumentará tu deuda con el proveedor.</p>
            </div>
            <form onSubmit={(e) => handleTransaction(e, 'invoice')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Monto de Factura ($)</label>
                  <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} min="0.01" step="0.01" required placeholder="Ej. 1500.50" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Descripción / No. Factura</label>
                  <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} required placeholder="Ej. Factura F-1234" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsInvoiceModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save" style={{backgroundColor: '#f59e0b'}}><FileText size={18} style={{ marginRight: 5, verticalAlign: 'middle' }}/> Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {isPaymentModalOpen && currentSupplier && (
        <div className="modal-overlay">
          <div className="modal-content supplier-modal">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <DollarSign size={28} style={{ color: '#10b981' }} />
              Registrar Pago
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)} style={{ marginLeft: 'auto' }}><X size={24} /></button>
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p>Proveedor: <strong>{currentSupplier.nombre}</strong></p>
              <p>Deuda Actual: <strong>${currentSupplier.balanceOwed.toFixed(2)}</strong></p>
            </div>
            <form onSubmit={(e) => handleTransaction(e, 'pay')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Monto a Pagar ($)</label>
                  <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} min="0.01" max={currentSupplier.balanceOwed} step="0.01" required placeholder="Ej. 500.00" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Descripción</label>
                  <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Ej. Pago en efectivo" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save"><DollarSign size={18} style={{ marginRight: 5, verticalAlign: 'middle' }}/> Pagar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
