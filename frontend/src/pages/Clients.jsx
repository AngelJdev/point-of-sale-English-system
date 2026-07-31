import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, MapPin, Edit, DollarSign, X, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from '../config/axios';
import './Clients.css';
import SearchBar from '../components/SearchBar';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('Abono a cuenta');

  const { currentUser } = useAuth();
  const token = currentUser?.token;

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  });

  const fetchClients = async () => {
    try {
      const { data } = await axios.get('/clients');
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    }
  };

  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        nombre: client.nombre,
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
        notas: client.notas || ''
      });
    } else {
      setCurrentClient(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: ''
      });
    }
    setIsModalOpen(true);
  };

  const openPaymentModal = (client) => {
    setCurrentClient(client);
    setPaymentAmount('');
    setPaymentDesc('Abono a cuenta');
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = async (client) => {
    setCurrentClient(client);
    setClientHistory([]);
    setIsHistoryModalOpen(true);
    try {
      const { data } = await axios.get(`/clients/${client._id}/history`);
      setClientHistory(data);
    } catch (error) {
      console.error('Error fetching client history:', error);
      toast.error('Error al cargar el historial del cliente');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = currentClient 
        ? `/clients/${currentClient._id}`
        : `/clients`;

      if (currentClient) {
        await axios.put(url, formData);
        toast.success('Cliente actualizado');
      } else {
        await axios.post(url, formData);
        toast.success('Cliente creado');
      }
      
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error de red al guardar cliente');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    try {
      const { data } = await axios.post(`/clients/${currentClient._id}/pay`, {
        amount: Number(paymentAmount),
        description: paymentDesc
      });

      toast.success('Pago registrado correctamente');
      setIsPaymentModalOpen(false);
      fetchClients();
      generateReceipt(currentClient, Number(paymentAmount), data.transaction);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error de red al procesar pago');
    }
  };

  const generateReceipt = (client, amount, transaction) => {
    // Generar un ticket básico en una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    const newBalance = client.balance - amount;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Abono</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; margin: auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .footer { text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
            .bold { font-weight: bold; }
            hr { border-top: 1px dashed #000; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>COMPROBANTE DE PAGO</h2>
            <p>${new Date(transaction.fecha).toLocaleString()}</p>
          </div>
          <hr/>
          <div class="content">
            <p><span class="bold">Cliente:</span> ${client.nombre}</p>
            <p><span class="bold">Monto Pagado:</span> $${amount.toFixed(2)}</p>
            <p><span class="bold">Descripción:</span> ${transaction.descripcion}</p>
            <hr/>
            <p><span class="bold">Saldo Anterior:</span> $${client.balance.toFixed(2)}</p>
            <p><span class="bold">Saldo Actual:</span> $${newBalance.toFixed(2)}</p>
          </div>
          <div class="footer">
            <p>¡Gracias por su pago!</p>
            <p>Conserve este ticket para cualquier aclaración.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredClients = clients.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1><Users size={32} /> Clientes</h1>
        <button className="add-client-btn" onClick={() => openModal()}>
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      <SearchBar 
        placeholder="Buscar cliente por nombre..." 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />

      <div className="clients-grid">
        {filteredClients.map(client => (
          <div key={client._id} className="client-card">
            <h3>
              {client.nombre}
            </h3>
            
            <div className="client-info">
              {client.telefono && <p><Phone size={16} /> {client.telefono}</p>}
              {client.direccion && <p><MapPin size={16} /> {client.direccion}</p>}
              {client.notas && <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}><strong>Notas:</strong> {client.notas}</p>}
            </div>

            <div className="client-balance">
              <span>Saldo Pendiente:</span>
              <span className={`balance-amount ${client.balance > 0 ? 'debt' : 'clear'}`}>
                ${client.balance.toFixed(2)}
              </span>
            </div>

            <div className="client-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button className="btn-edit" onClick={() => openModal(client)} style={{ flex: 1 }}>
                <Edit size={16} /> Editar
              </button>
              <button className="btn-pay" onClick={() => openPaymentModal(client)} disabled={client.balance <= 0} style={{ flex: 1 }}>
                <DollarSign size={16} /> Abonar
              </button>
              <button className="btn-history" onClick={() => openHistoryModal(client)} style={{ flex: '1 1 100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                 Historial
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-form-content client-form-modal">
            <div className="modal-header">
              <h2>{currentClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Nombre del Cliente *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} />
              </div>
              
              <div className="form-group">
                <label>Notas / Control de Pedidos</label>
                <textarea 
                  name="notas" 
                  value={formData.notas} 
                  onChange={handleInputChange} 
                  rows="3" 
                  placeholder="Ej. Dejó pendiente 2 llantas..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-actions">
                <div className="form-buttons">
                  <button type="button" className="btn-cancelar" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-guardar"><Check size={20} style={{ marginRight: 5 }}/> Guardar Cliente</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abonar */}
      {isPaymentModalOpen && currentClient && (
        <div className="modal-overlay">
          <div className="modal-form-content">
            <div className="modal-header" style={{ backgroundColor: '#f59e0b' }}>
              <h2>Registrar Abono</h2>
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}><X size={32} /></button>
            </div>
            <form onSubmit={handlePayment} className="product-form">
              <div style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                <p><strong>Cliente:</strong> {currentClient.nombre}</p>
                <p><strong>Deuda Actual:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>${currentClient.balance.toFixed(2)}</span></p>
              </div>
              <div className="form-group">
                <label>Monto a Abonar ($) *</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min="1" max={currentClient.balance} step="0.01" required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" value={paymentDesc} onChange={(e) => setPaymentDesc(e.target.value)} />
              </div>

              <div className="form-actions">
                <div className="form-buttons" style={{ gap: '1rem' }}>
                  <button type="button" className="btn-cancelar" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                  <button 
                    type="button" 
                    className="btn-cancelar" 
                    style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      openHistoryModal(currentClient);
                    }}
                  >
                    Volver a Historial
                  </button>
                  <button type="submit" className="btn-guardar" style={{ backgroundColor: '#f59e0b', color: 'white' }}><DollarSign size={20} style={{ marginRight: 5 }}/> Procesar Pago</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {isHistoryModalOpen && currentClient && (
        <div className="modal-overlay">
          <div className="modal-form-content history-modal-content">
            <div className="modal-header">
              <h2>Historial de Cuenta: {currentClient.nombre}</h2>
              <button className="close-btn" onClick={() => setIsHistoryModalOpen(false)}><X size={32} /></button>
            </div>
            
            <div className="history-balance-card">
               <span className="balance-label">Saldo Actual</span>
               <span className={`balance-value ${currentClient.balance > 0 ? 'debt' : 'clear'}`}>
                 ${currentClient.balance.toFixed(2)}
               </span>
            </div>
            
            <div className="table-responsive history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th className="align-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {clientHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-history">
                        No hay movimientos registrados para este cliente.
                      </td>
                    </tr>
                  ) : (
                    clientHistory.map((mov, index) => (
                      <tr key={mov._id || index}>
                        <td>{new Date(mov.fecha).toLocaleString()}</td>
                        <td>
                          <span className={`history-badge ${mov.tipo === 'Cargo' ? 'badge-cargo' : 'badge-abono'}`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td>{mov.descripcion}</td>
                        <td className={`align-right fw-bold ${mov.tipo === 'Cargo' ? 'text-danger' : 'text-success'}`}>
                          {mov.tipo === 'Cargo' ? '+' : '-'}${mov.monto.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-actions" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div className="form-buttons" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-cancelar" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</button>
                <button 
                  type="button" 
                  className="btn-pay" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: currentClient.balance > 0 ? '#10b981' : '#d1d5db', color: 'white', border: 'none', cursor: currentClient.balance > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                  disabled={currentClient.balance <= 0}
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    openPaymentModal(currentClient);
                  }}
                >
                  <DollarSign size={20} style={{ marginRight: '5px' }} /> Abonar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;
