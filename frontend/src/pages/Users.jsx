import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import Swal from 'sweetalert2';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    role: 'staff'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', formData);
      Swal.fire('¡Éxito!', 'Usuario creado exitosamente', 'success');
      setFormData({ nombre: '', usuario: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al crear el usuario', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
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
        await axios.delete(`/users/${id}`);
        Swal.fire('Eliminado', 'Usuario eliminado correctamente', 'success');
        fetchUsers();
      } catch (error) {
        Swal.fire('Error', 'Error al eliminar el usuario', 'error');
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={20} color="#ef4444" />;
      default: return <User size={20} color="#3b82f6" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      default: return 'Empleado';
    }
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Gestión de Usuarios</h1>
      </div>

      <div className="users-content">
        <div className="form-panel">
          <h2><UserPlus size={24} style={{marginRight: '10px'}}/> Alta de Nuevo Usuario</h2>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                required 
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div className="form-group">
              <label>Usuario (Login)</label>
              <input 
                type="text" 
                name="usuario" 
                value={formData.usuario} 
                onChange={handleChange} 
                required 
                placeholder="Ej. jperez"
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group">
              <label>Rol en el Sistema</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="staff">Empleado (Caja e Inventario base)</option>
                <option value="admin">Administrador (Acceso Total)</option>
              </select>
            </div>

            <button type="submit" className="submit-user-btn">Crear Usuario</button>
          </form>
        </div>

        <div className="list-panel">
          <h2>Usuarios Activos</h2>
          {loading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <div className="users-grid">
              {users.map(user => (
                <div key={user._id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-role-badge">
                      {getRoleIcon(user.role)}
                      <span>{getRoleLabel(user.role)}</span>
                    </div>
                    {user.usuario !== 'admin' && ( // Evitar borrar al admin base temporal
                      <button className="delete-user-btn" onClick={() => handleDelete(user._id)} title="Eliminar usuario">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  <div className="user-info">
                    <h3>{user.nombre}</h3>
                    <p>@{user.usuario}</p>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="no-users">No hay usuarios registrados. ¡Crea el primero!</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
