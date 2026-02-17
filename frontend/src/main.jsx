import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#1A1A1A',
            fontSize: '0.875rem',
            borderRadius: '0.75rem',
            border: '1px solid #E9ECEF',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#ECFDF5' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#FEF2F2' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
