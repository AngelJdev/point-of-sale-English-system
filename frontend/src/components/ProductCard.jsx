import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const isLowStock = product.stock_actual <= product.stock_minimo;

  return (
    <div 
      className="product-card" 
      onClick={() => addToCart(product)} 
      style={{cursor: 'pointer'}}
    >
      <div className="product-image-container">
        {product.imageUrl && !imgError ? (
          <img 
            src={product.imageUrl} 
            alt={product.nombre} 
            className="product-image" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-image-placeholder">
            <Package size={80} color="#9ca3af" />
          </div>
        )}
      </div>
      
      <div className="product-content">
        <h2 className="product-title">{product.nombre}</h2>
        <p className="product-brand">{product.marca || 'Marca Genérica'}</p>
        
        <div className="product-details">
          <span className="product-code">Cód: {product.codigo_interno}</span>
          {product.compatibilidad && product.compatibilidad.length > 0 && (
            <p className="product-compatibility">
              <strong>Para:</strong> {product.compatibilidad.slice(0, 2).join(', ')}
              {product.compatibilidad.length > 2 && ' ...'}
            </p>
          )}
        </div>

        <div className="product-price-stock">
          <span className="product-price">${product.precio_publico.toFixed(2)}</span>
          <span className={`product-stock ${isLowStock ? 'stock-low' : 'stock-ok'}`}>
            {product.stock_actual} disp.
          </span>
        </div>

        <button 
          className="add-button" 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
