import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, User, Settings, Menu, X, Globe, Download, Link2 } from 'lucide-react';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [icsCopySuccess, setIcsCopySuccess] = useState(false);

  const icsUrl = user ? `${window.location.origin}/my-roster-ics?user=${user.id}` : '';

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="header-brand">
          <img src="/Logo.png" alt="" className="header-logo" />
          <span className="header-title">{i18n.language === 'de' ? t('dienstplan') : t('dutyRoster')}</span>
        </div>
      </div>
      
      <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/roster" 
          className={isActive('/roster') ? 'active' : ''}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Calendar size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {t('teamRoster')}
        </Link>
        <Link 
          to="/my-roster" 
          className={isActive('/my-roster') ? 'active' : ''}
          onClick={() => setMobileMenuOpen(false)}
        >
          <User size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {t('myRoster')}
        </Link>
        {isAdmin && (
          <Link 
            to="/admin/employees" 
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('admin')}
          </Link>
        )}
      </nav>

      <div className="header-actions">
        {user && icsUrl && (
          <button 
            className="btn-icon" 
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(icsUrl);
                setIcsCopySuccess(true);
                setTimeout(() => setIcsCopySuccess(false), 2000);
              } catch {}
            }}
            title={icsCopySuccess ? 'Copied!' : 'Copy calendar subscription URL'}
          >
            {icsCopySuccess ? <Download size={20} /> : <Link2 size={20} />}
          </button>
        )}
 
        <div className="lang-menu-container">
          <button 
            className="btn-icon" 
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            title="Language"
          >
            <Globe size={20} />
          </button>
          {langMenuOpen && (
            <div className="lang-menu">
              <button 
                className={i18n.language === 'de' ? 'active' : ''}
                onClick={() => changeLanguage('de')}
              >
                Deutsch
              </button>
              <button 
                className={i18n.language === 'en' ? 'active' : ''}
                onClick={() => changeLanguage('en')}
              >
                English
              </button>
            </div>
          )}
        </div>
        {user && (
          <div className="user-menu">
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <span style={{ fontWeight: 500 }}>{user.name}</span>
            <button className="btn-icon" onClick={logout} title={t('logout')}>
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;