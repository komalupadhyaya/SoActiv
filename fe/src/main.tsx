// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';

// Configure global axios interceptor to automatically attach authorization headers
// for raw axios requests (used extensively in pages like superAdmin dashboard, list, etc.)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
