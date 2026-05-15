import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import { TrendingUp, ReceiptText, Calendar, Archive, CheckCircle } from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('diario');
  const [sales, setSales] = useState([]);
  const [monthlyCuts, setMonthlyCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'diario') {
        const response = await axios.get('/sales/daily');
        setSales(response.data);
      } else {
        const response = await axios.get('/sales/monthly-cuts');
        setMonthlyCuts(response.data);
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalIngresos = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTickets = sales.length;

  const handleCloseCut = async () => {
    if (totalTickets === 0) {
      Swal.fire('Atención', 'No hay ventas para cerrar el día.', 'warning');
      return;
    }
    
    const result = await Swal.fire({
      title: '¿Finalizar corte del día?',
      text: `¿Estás seguro de finalizar el corte con $${totalIngresos.toFixed(2)} de ingresos? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, finalizar corte',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        const response = await axios.post('/sales/close-cut');
        Swal.fire('¡Éxito!', response.data.message, 'success');
        fetchData(); // Recargar datos
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al finalizar el corte.', 'error');
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reportes y Estadísticas</h1>
        <div className="reports-tabs">
          <button 
            className={`tab-btn ${activeTab === 'diario' ? 'active' : ''}`}
            onClick={() => setActiveTab('diario')}
          >
            Corte del Día
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mensual' ? 'active' : ''}`}
            onClick={() => setActiveTab('mensual')}
          >
            Historial de Cortes
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Cargando información...</p>
      ) : activeTab === 'diario' ? (
        <>
          <div className="dashboard-cards">
            <div className="card income-card">
              <div className="card-icon">
                <TrendingUp size={48} color="#16a34a" />
              </div>
              <div className="card-content">
                <h3>Ingresos Hoy</h3>
                <p className="gigantic-text text-green">${totalIngresos.toFixed(2)}</p>
              </div>
            </div>

            <div className="card tickets-card">
              <div className="card-icon">
                <ReceiptText size={48} color="#2563eb" />
              </div>
              <div className="card-content">
                <h3>Tickets Emitidos</h3>
                <p className="gigantic-text text-blue">{totalTickets}</p>
              </div>
            </div>

            <div className="card action-card">
              <div className="card-icon">
                <Archive size={48} color="#ea580c" />
              </div>
              <div className="card-content">
                <h3>Cierre de Caja</h3>
                <button 
                  className="close-cut-btn" 
                  onClick={handleCloseCut}
                  disabled={actionLoading || totalTickets === 0}
                >
                  <CheckCircle size={20} />
                  <span>Finalizar Corte</span>
                </button>
              </div>
            </div>
          </div>

          <div className="table-container">
            <h2>Detalle de Ventas ({totalTickets})</h2>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>ID Ticket</th>
                  <th>Método de Pago</th>
                  <th>Subtotal</th>
                  <th>IVA (16%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No hay ventas registradas el día de hoy.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="font-bold">
                        {new Date(sale.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="font-mono text-gray">...{sale._id.slice(-6).toUpperCase()}</td>
                      <td>
                        <span className={`payment-badge ${sale.metodo_pago === 'Efectivo' ? 'badge-cash' : 'badge-card'}`}>
                          {sale.metodo_pago}
                        </span>
                      </td>
                      <td>${sale.subtotal.toFixed(2)}</td>
                      <td>${sale.impuestos.toFixed(2)}</td>
                      <td className="font-bold text-primary">${sale.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-container">
          <h2>Historial de Cortes Cerrados (Últimos 30)</h2>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Fecha de Corte</th>
                <th>Responsable</th>
                <th>Total Tickets</th>
                <th>Ingresos Totales</th>
              </tr>
            </thead>
            <tbody>
              {monthlyCuts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">Aún no hay cortes de caja cerrados.</td>
                </tr>
              ) : (
                monthlyCuts.map((cut) => (
                  <tr key={cut._id}>
                    <td className="font-bold">
                      {new Date(cut.fecha_corte).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td>
                      <span className="font-bold text-gray">{cut.cerrado_por?.nombre || 'Administrador'}</span>
                    </td>
                    <td className="font-bold">{cut.total_tickets}</td>
                    <td className="font-bold text-green gigantic-text-small">${cut.total_ingresos.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
