import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { recoverPassword } from '@netlify/identity';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash;
    const hashTokenMatch = hash.match(/recovery_token=([^&]+)/);
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
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    if (!token) {
      setError(t('recoveryLinkInvalid'));
      return;
    }

    setLoading(true);

    try {
      await recoverPassword(token, password);
      navigate('/login');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('expired') || message.includes('invalid')) {
        setError(t('recoveryLinkExpired'));
      } else {
        setError(message || t('passwordResetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('resetPassword')}</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="label">{t('enterNewPassword')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('confirmNewPassword')}</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('resetPassword') : t('resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
