import axios from 'axios';

// Save the original create method
const originalCreate = axios.create;

// Patch axios.create to automatically attach Authorization interceptor to every custom instance
axios.create = function (config) {
  const instance = originalCreate.call(axios, config);

  instance.interceptors.request.use(
    (cfg) => {
      const token = localStorage.getItem('accessToken');
      if (token && !cfg.headers.Authorization) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

// Also apply request interceptor to the default global axios instance
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
