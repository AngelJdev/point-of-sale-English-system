import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { History, Search, FileText, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import SaleDetailModal from '../components/SaleDetailModal';
import './SalesHistory.css';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [currentPage, searchTerm]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/sales?page=${currentPage}&limit=12&search=${searchTerm}`);
      setSales(response.data.sales);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-left">
          <History size={32} color="var(--primary-color)" />
          <h1>Historial de Ventas</h1>
        </div>
        
        <div className="history-search">
          <Search size={24} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por Folio (ID)..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reiniciar a página 1 al buscar
            }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">Cargando ventas...</div>
        ) : (
          <>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Folio</th>
                  <th>Método</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">No se encontraron ventas registradas.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="date-cell">
                        <div className="date-main">{new Date(sale.fecha).toLocaleDateString()}</div>
                        <div className="date-sub">{new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="folio-cell">
                        #{sale._id.slice(-6).toUpperCase()}
                        {sale.estado === 'devuelta' && <span className="table-status-devuelta"> (DEVUELTA)</span>}
                      </td>
                      <td>
                        <span className={`method-badge ${sale.metodo_pago === 'Efectivo' ? 'cash' : 'card'} ${sale.estado === 'devuelta' ? 'disabled' : ''}`}>
                          {sale.metodo_pago}
                        </span>
                      </td>
                      <td className="items-count">
                        {sale.items.reduce((sum, item) => sum + item.cantidad, 0)} piezas
                      </td>
                      <td className="total-cell">${sale.total.toFixed(2)}</td>
                      <td>
                        <button className="detail-btn" onClick={() => handleOpenDetail(sale)}>
                          <Eye size={18} />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="page-btn"
                >
                  <ChevronLeft size={24} />
                  Anterior
                </button>
                <span className="page-info">Página {currentPage} de {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="page-btn"
                >
                  Siguiente
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <SaleDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sale={selectedSale}
        onSaleUpdated={fetchSales}
      />
    </div>
  );
};

export default SalesHistory;
