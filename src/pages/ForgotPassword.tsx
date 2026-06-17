import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { requestPasswordRecovery } from '@netlify/identity';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordRecovery(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t('resetPassword')}</h1>
          <p className="auth-message">{t('resetLinkSent')}</p>
          <Link to="/login" className="btn btn-primary">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('resetPassword')}</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="label">{t('email')}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('sendResetLink') : t('sendResetLink')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">{t('backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
