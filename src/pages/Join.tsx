import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acceptInvite } from '@netlify/identity';
import { useTranslation } from 'react-i18next';

const Join: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash;
    const hashTokenMatch = hash.match(/invite_token=([^&]+)/);
    if (hashTokenMatch) {
      setToken(hashTokenMatch[1]);
    } else {
      const queryToken = searchParams.get('token');
      if (queryToken) {
        setToken(queryToken);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (!token) {
      setError(t('inviteLinkInvalid'));
      return;
    }

    setLoading(true);

    try {
      await acceptInvite(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/roster'), 1500);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('expired') || message.includes('invalid')) {
        setError(t('inviteExpired'));
      } else {
        setError(message || t('failedToAcceptInvite') || 'Failed to accept invite');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('setPassword')}</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
            {t('accountCreated')}
            </div>
          )}
          
          <div className="form-group">
            <label className="label">{t('password')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={success}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('confirmPassword')}</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={success}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || success}>
            {loading ? t('creatingAccount') : t('acceptInvite')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Join;
