import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import SalesHistory from './pages/SalesHistory';
import Users from './pages/Users';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import { Check, AlertCircle } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '16px',
            },
            success: {
              style: {
                background: '#166534', // Verde oscuro
                color: '#fff',
              },
              icon: <Check size={24} color="white" />,
              iconTheme: {
                primary: 'transparent',
                secondary: 'transparent',
              },
            },
            error: {
              style: {
                background: '#991b1b', // Rojo oscuro
                color: '#fff',
              },
              icon: <AlertCircle size={24} color="white" />,
              iconTheme: {
                primary: 'transparent',
                secondary: 'transparent',
              },
            },
          }}
        />
        <Router>
          <Routes>
            {/* Ruta Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas envueltas en el Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><POS /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout><Inventory /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout><SalesHistory /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout><Users /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
