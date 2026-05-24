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

export default instance;
