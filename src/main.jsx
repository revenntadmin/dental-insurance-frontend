import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { MfaProvider } from './features/auth/MfaContext';
import { query_client } from './lib/query_client';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={query_client}>
        <AuthProvider>
          <MfaProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster richColors closeButton position="top-right" />
          </MfaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
