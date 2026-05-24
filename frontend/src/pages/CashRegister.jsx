import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Archive, Plus } from 'lucide-react';
import './CashRegister.css';

const CashRegister = () => {
  const [activeRegister, setActiveRegister] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRegister = async () => {
    try {
      const response = await axios.get('/cash/current');
      setActiveRegister(response.data);
    } catch (error) {
      console.error('Error al cargar caja:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, []);

  const handleOpenRegister = async () => {
    const { value: fondo } = await Swal.fire({
      title: 'Abrir Caja Chica',
      input: 'number',
      inputLabel: 'Fondo Inicial en Cajón ($)',
      inputPlaceholder: 'Ej. 1500',
      showCancelButton: true,
      confirmButtonText: 'Abrir Caja',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value < 0) return 'Ingrese un fondo inicial válido';
      }
    });

    if (fondo) {
      try {
        await axios.post('/cash/open', { fondo_inicial: parseFloat(fondo) });
        Swal.fire('Caja Abierta', `Se inició el turno con $${fondo}`, 'success');
        fetchRegister();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al abrir caja', 'error');
      }
    }
  };

  const handleAddExpense = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Registrar Gasto',
      html:
        '<input id="swal-concepto" class="swal2-input" placeholder="Concepto del gasto (Ej. Garrafón de agua)">' +
        '<input id="swal-monto" type="number" step="0.01" class="swal2-input" placeholder="Monto ($)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const concepto = document.getElementById('swal-concepto').value;
        const monto = parseFloat(document.getElementById('swal-monto').value);
        if (!concepto || !monto || monto <= 0) {
          Swal.showValidationMessage('Ingrese concepto y un monto mayor a 0');
        }
        return { concepto, monto };
      }
    });

    if (formValues) {
      try {
        await axios.post('/cash/expense', formValues);
        Swal.fire('Registrado', 'El gasto se ha añadido a la caja', 'success');
        fetchRegister();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al registrar gasto', 'error');
      }
    }
  };

  const handleCloseRegister = async () => {
    const confirm = await Swal.fire({
      title: '¿Cerrar Caja?',
      text: 'Se hará el corte final sumando ventas en efectivo y restando gastos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar ahora',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.post('/cash/close');
        Swal.fire(
          'Caja Cerrada',
          `El corte se realizó exitosamente. Total esperado en cajón: $${res.data.total_esperado.toFixed(2)}`,
          'success'
        );
        fetchRegister();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al cerrar caja', 'error');
      }
    }
  };

  if (loading) return <div className="loading-box">Cargando estado de caja...</div>;

  if (!activeRegister) {
    return (
      <div className="cash-container">
        <div className="closed-register-box">
          <Archive size={64} className="closed-icon" />
          <h2>Caja Cerrada</h2>
          <p>Para iniciar a cobrar y registrar movimientos, debes aperturar la caja chica con un fondo base.</p>
          <button className="btn-open-register" onClick={handleOpenRegister}>
            APERTURAR CAJA
          </button>
        </div>
      </div>
    );
  }

  const totalSalidas     = activeRegister.salidas_efectivo?.reduce((acc, curr) => acc + curr.monto, 0) || 0;
  const ingresosVentas   = activeRegister.ingresos_ventas || 0;
  // Fórmula: Fondo Inicial + Ventas en Efectivo − Gastos/Salidas
  // total_esperado viene calculado desde el backend; el fallback cubre el caso
  // en que la caja se abrió pero aún no tiene ingresos guardados en el modelo.
  const totalEsperado    = activeRegister.total_esperado
    ?? (activeRegister.fondo_inicial + ingresosVentas - totalSalidas);

  return (
    <div className="cash-container">
      <div className="cash-header">
        <h1>Control de Flujo de Efectivo</h1>
        <p>Apertura: {new Date(activeRegister.fecha).toLocaleString()}</p>
      </div>

      <div className="cash-cards">
        <div className="cash-card">
          <div className="card-icon blue"><Wallet /></div>
          <div className="card-info">
            <h3>Fondo Inicial</h3>
            <p>${activeRegister.fondo_inicial.toFixed(2)}</p>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-icon green"><TrendingUp /></div>
          <div className="card-info">
            <h3>Ventas en Efectivo</h3>
            <p>${ingresosVentas.toFixed(2)}</p>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-icon red"><TrendingDown /></div>
          <div className="card-info">
            <h3>Gastos / Salidas</h3>
            <p>${totalSalidas.toFixed(2)}</p>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-icon green"><DollarSign /></div>
          <div className="card-info">
            <h3>Total Esperado en Cajón</h3>
            <p>${totalEsperado.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="cash-actions">
        <button className="btn-expense" onClick={handleAddExpense}>
          <Plus size={20} /> Registrar Gasto
        </button>
        <button className="btn-close" onClick={handleCloseRegister}>
          Cerrar Caja
        </button>
      </div>

      <div className="expenses-list">
        <h3>Historial de Gastos (Salidas)</h3>
        {activeRegister.salidas_efectivo && activeRegister.salidas_efectivo.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Concepto</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {activeRegister.salidas_efectivo.map((gasto, idx) => (
                <tr key={idx}>
                  <td>{new Date(gasto.fecha).toLocaleString()}</td>
                  <td>{gasto.concepto}</td>
                  <td>${gasto.monto.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-expenses">No se han registrado salidas de efectivo.</p>
        )}
      </div>
    </div>
  );
};

export default CashRegister;
