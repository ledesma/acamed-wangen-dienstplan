import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { handleAuthCallback, hydrateSession } from '@netlify/identity';
import App from './App';
import './i18n';
import './index.css';

const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/;

const initAuth = async () => {
  if (typeof window === 'undefined') return;

  if (AUTH_HASH_PATTERN.test(window.location.hash)) {
    const result = await handleAuthCallback();
    if (result) {
      if (result.type === 'recovery') {
        window.location.href = '/reset-password';
      } else if (result.type === 'invite') {
        window.location.href = `/join?token=${result.token}`;
      } else {
        window.location.href = '/';
      }
    }
    return;
  }

  await hydrateSession();
};

initAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
