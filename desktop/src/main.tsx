import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initClientSecurity } from './utils/security';

initClientSecurity();

// HashRouter (not BrowserRouter): packaged Electron loads index.html over the
// file:// protocol, where history-based routing can't match and renders blank.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
