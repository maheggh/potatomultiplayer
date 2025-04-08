// src/services/api.js (Corrected for Vite)

import axios from "axios";

// Access Vite env var using import.meta.env and the VITE_ prefix
const backendRootUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Construct the base URL for API calls by appending /api
const apiBaseUrl = `${backendRootUrl}/api`;

// Log the final base URL being used (useful for debugging)
console.log(">>>> Axios baseURL configured to (Vite):", apiBaseUrl);

// Create the Axios instance with the correctly constructed API base URL
const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // Important for session cookies if you use them
});

// --- Keep your Interceptors ---
api.interceptors.request.use(
  (config) => {
    const isAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    const requiresAuth = (
        (config.method === 'post' || config.method === 'put' || config.method === 'delete') &&
        (config.url?.startsWith('/courses') || config.url?.startsWith('/images') || config.url?.startsWith('/jail/breakout'))
    );

    if (isAdmin && requiresAuth) {
       config.headers['X-Admin-Authenticated'] = 'true';
       // console.log("API Interceptor: Adding Admin Auth Header for:", config.method, config.url); // Keep for debug if needed
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API call error via interceptor:', error.response || error.message || error);
    return Promise.reject(error);
  }
);

export default api;