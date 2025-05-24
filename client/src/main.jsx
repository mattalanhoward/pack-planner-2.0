import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css' // THIS IS CRUCIAL!
import { AuthProvider } from './contexts/AuthContext';

import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
