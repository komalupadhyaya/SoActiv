import './utils/axiosConfig';
// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Configure global fetch patch to automatically attach authorization headers
// for raw window.fetch requests (used extensively in hooks like useGymClass, useSchedule, modals, etc.)
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const token = localStorage.getItem('accessToken');
  
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = (input as any).url;
  }

  const isBackendUrl = url.includes('/api/v1') || url.includes('/api/') || !url.startsWith('http');

  if (token && isBackendUrl) {
    init = init || {};
    if (input instanceof Request) {
      if (!input.headers.has('Authorization')) {
        input.headers.set('Authorization', `Bearer ${token}`);
      }
    } else {
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        if (!init.headers.has('Authorization')) {
          init.headers.set('Authorization', `Bearer ${token}`);
        }
      } else if (Array.isArray(init.headers)) {
        const hasAuth = init.headers.some(([key]) => key.toLowerCase() === 'authorization');
        if (!hasAuth) {
          init.headers.push(['Authorization', `Bearer ${token}`]);
        }
      } else {
        const hasAuth = Object.keys(init.headers).some(key => key.toLowerCase() === 'authorization');
        if (!hasAuth) {
          (init.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
