import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { handleAuthCallback, hydrateSession } from '@netlify/identity';
import App from './App';
import './i18n';
import './index.css';

const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/;

const initAuth = async () => {
  if (typeof window === 'undefined') return;

  if (AUTH_HASH_PATTERN.test(window.location.hash)) {
    try {
      const hash = window.location.hash;
      const recoveryMatch = hash.match(/recovery_token=([^&]+)/);
      const inviteMatch = hash.match(/invite_token=([^&]+)/);
      const recoveryToken = recoveryMatch?.[1];
      const inviteToken = inviteMatch?.[1];

      const result = await handleAuthCallback();
      if (result) {
        if (result.type === 'recovery') {
          window.location.hash = `#/reset-password?token=${recoveryToken || ''}`;
        } else if (result.type === 'invite') {
          window.location.hash = `#/join?token=${inviteToken || ''}`;
        } else {
          window.location.hash = '#/';
        }
      } else {
        window.location.hash = '#/login';
      }
    } catch (err) {
      console.error('Auth callback failed:', err);
      window.location.hash = '#/login';
    }
    return;
  }

  await hydrateSession();
};

initAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
