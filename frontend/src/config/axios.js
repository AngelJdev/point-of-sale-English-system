import axios from 'axios';

const instance = axios.create({
  // Consumiendo de forma estricta la variable de entorno Vite (Development / Production)
  baseURL: import.meta.env.VITE_API_URL
});

// Interceptor para inyectar el token en cada peticion automaticamente
instance.interceptors.request.use((config) => {
  const userInfo = sessionStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta para detectar caídas del servidor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si hay error de red o el servidor responde 500 o más (caída/crash)
    if (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) {
      // Redirigir a la pantalla de mantenimiento
      if (window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
