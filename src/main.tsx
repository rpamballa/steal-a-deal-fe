import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import {ErrorBoundary} from './components/ErrorBoundary';
import {AuthProvider} from './context/AuthContext';
import './styles.css';

// Default to the light (buyer/guest) canvas to avoid a dark flash on
// first paint; App switches to dark once a DEALER/ADMIN is known.
if (typeof document !== 'undefined' && !document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = 'light';
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
