import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Phone, Building2, Edit, DollarSign, X, Check, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
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
    empresa: ''
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
        empresa: supplier.empresa || ''
      });
    } else {
      setCurrentSupplier(null);
      setFormData({ nombre: '', contacto: '', telefono: '', empresa: '' });
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
      const url = currentSupplier 
        ? `/suppliers/${currentSupplier._id}`
        : `/suppliers`;

      if (currentSupplier) {
        await axios.put(url, formData);
        toast.success('Proveedor actualizado');
      } else {
        await axios.post(url, formData);
        toast.success('Proveedor creado');
      }
      
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error de red al guardar proveedor');
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
            <h3>{supplier.nombre}</h3>
            {supplier.empresa && <div className="supplier-company"><Building2 size={14} style={{display:'inline', marginRight: 4}}/>{supplier.empresa}</div>}
            
            <div className="supplier-info">
              {supplier.telefono && <p><Phone size={16} /> {supplier.telefono}</p>}
            </div>

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
          <div className="modal-content">
            <h2>
              {currentSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <input type="text" name="empresa" value={formData.empresa} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Contacto (Persona)</label>
                <input type="text" name="contacto" value={formData.contacto} onChange={handleInputChange} />
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
          <div className="modal-content">
            <h2>
              Registrar Compra (Factura)
              <button className="close-btn" onClick={() => setIsInvoiceModalOpen(false)}><X size={24} /></button>
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p>Proveedor: <strong>{currentSupplier.nombre}</strong></p>
              <p>Al registrar, esto aumentará tu deuda con el proveedor.</p>
            </div>
            <form onSubmit={(e) => handleTransaction(e, 'invoice')}>
              <div className="form-group">
                <label>Monto de Factura ($)</label>
                <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Descripción / No. Factura</label>
                <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} required />
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
          <div className="modal-content">
            <h2>
              Registrar Pago
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}><X size={24} /></button>
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p>Proveedor: <strong>{currentSupplier.nombre}</strong></p>
              <p>Deuda Actual: <strong>${currentSupplier.balanceOwed.toFixed(2)}</strong></p>
            </div>
            <form onSubmit={(e) => handleTransaction(e, 'pay')}>
              <div className="form-group">
                <label>Monto a Pagar ($)</label>
                <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} min="0.01" max={currentSupplier.balanceOwed} step="0.01" required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} />
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
