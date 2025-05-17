import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  
import App from './App';  
import { AuthProvider } from "./context/AuthContext"; 

// Render the App component into the root div in the HTML
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
