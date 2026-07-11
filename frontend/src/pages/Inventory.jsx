import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import { PlusCircle, Package, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import ProductFormModal from '../components/ProductFormModal';
import SearchBar from '../components/SearchBar';
import './Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToEdit, setProductToEdit] = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Función para obtener todos los productos
  const fetchProducts = async (term = searchTerm, page = currentPage, isLowStock = showLowStockOnly) => {
    setLoading(true);
    try {
      const response = await axios.get(`/products?search=${term}&page=${page}&limit=12&lowStock=${isLowStock}`);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm, 1, showLowStockOnly);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, showLowStockOnly]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchProducts(searchTerm, newPage, showLowStockOnly);
    }
  };

  // Función para eliminar producto
  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: '¿Eliminar refacción?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/products/${productId}`);
        Swal.fire('Eliminado', 'Producto eliminado correctamente', 'success');
        fetchProducts(); // Recargar la tabla
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        Swal.fire('Error', error.response?.data?.message || 'Ocurrió un error al intentar eliminar el producto.', 'error');
      }
    }
  };

  // Ocultar imagen rota y mostrar ícono de paquete
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Gestión de Inventario</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className={`filter-btn ${showLowStockOnly ? 'filter-active' : ''}`}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <AlertTriangle size={20} />
            <span>Urgente Resurtir</span>
          </button>
          <button className="new-product-btn" onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }}>
            <PlusCircle size={32} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading-text">Cargando inventario...</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Marca</th>
                <th>Ubicación</th>
                <th>Precio Púb.</th>
                <th style={{textAlign: 'center'}}>Stock</th>
                <th style={{textAlign: 'center'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No hay productos que coincidan con la búsqueda.</td>
                </tr>
              ) : (
                products.map((product) => {
                  let stockStatus = 'stock-green';
                  if (product.stock_actual === 0) {
                    stockStatus = 'stock-purple';
                  } else if (product.stock_actual < product.stock_minimo) {
                    stockStatus = 'stock-red';
                  } else if (product.stock_actual === product.stock_minimo) {
                    stockStatus = 'stock-yellow';
                  }
                  
                  return (
                    <tr key={product._id}>
                      <td className="td-image">
                        <div className="thumbnail-container">
                          {product.imageUrl ? (
                            <>
                              <img 
                                src={product.imageUrl} 
                                alt={product.nombre} 
                                className="thumbnail"
                                onError={handleImageError}
                              />
                              <div className="thumbnail-placeholder" style={{display: 'none'}}>
                                <Package size={28} color="#9ca3af" />
                              </div>
                            </>
                          ) : (
                            <div className="thumbnail-placeholder">
                              <Package size={28} color="#9ca3af" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono font-bold">{product.codigo_interno}</td>
                      <td className="desc-cell">{product.nombre}</td>
                      <td>{product.marca || '-'}</td>
                      <td>{product.ubicacion_fisica || '-'}</td>
                      <td className="font-bold text-primary">${product.precio_publico?.toFixed(2)}</td>
                      
                      {/* Lógica condicional de Stock */}
                      <td className={`stock-cell ${stockStatus}`}>
                        {product.stock_actual} {product.unidad_medida || 'pza'}
                      </td>

                      <td style={{textAlign: 'center'}}>
                        <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                          <button 
                            className="edit-btn" 
                            onClick={() => {
                              setProductToEdit(product);
                              setIsModalOpen(true);
                            }}
                            title="Editar producto"
                          >
                            <Edit size={28} />
                          </button>
                          <button 
                            className="delete-action-btn" 
                            onClick={() => handleDelete(product._id)}
                            title="Eliminar producto"
                          >
                            <Trash2 size={28} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft size={24} />
            <span>Anterior</span>
          </button>
          <span className="pagination-text">Página {currentPage} de {totalPages}</span>
          <button 
            className="pagination-btn" 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Modal para crear/editar productos */}
      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProductAdded={fetchProducts} 
        productToEdit={productToEdit}
      />
    </div>
  );
};

export default Inventory;
