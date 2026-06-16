import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, User, Settings, Menu, X, Globe, Link2 } from 'lucide-react';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin, isEmployee } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const icsUrl = user ? `${window.location.origin}/my-roster-ics?user=${user.email}` : '';

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.lang-dropdown')) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  const copyIcsUrl = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
    } catch { }
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
        {user && (
          <>
            <div className="nav-user-name mobile-only">{user.name}</div>
            <hr className="nav-divider mobile-only" />
          </>
        )}
        <span className="nav-spacer desktop-only"></span>
        <div className="nav-center">
          <Link 
            to="/roster" 
            className={isActive('/roster') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('teamRoster')}
          </Link>
          {isEmployee && (
            <Link 
              to="/my-roster" 
              className={isActive('/my-roster') ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('myRoster')}
            </Link>
          )}
          {isAdmin && (
            <Link 
              to="/admin/users" 
              className={location.pathname.startsWith('/admin') ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {t('adminPage')}
            </Link>
          )}
        </div>
        {user && (
          <>
            <hr className="nav-divider mobile-only" />
            <span className="nav-spacer desktop-only"></span>
            <button className="nav-action" onClick={copyIcsUrl}>
              <Link2 size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              <label className="nav-label">{t('copyCalendarUrl')}</label>
            </button>
            <span className="nav-user-name desktop-only">&nbsp; &nbsp; {user.name}</span>
            <div className="lang-dropdown">
              <button className="nav-action" onClick={() => setLangDropdownOpen(!langDropdownOpen)}>
                <Globe size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                <label className="nav-label">{i18n.language === 'de' ? 'DE' : 'EN'}</label>
              </button>
              {langDropdownOpen && (
                <div className="lang-menu">
                  <button className="lang-option" onClick={() => { changeLanguage('de'); setLangDropdownOpen(false); }} style={{ fontWeight: i18n.language === 'de' ? 700 : 500 }}>{t('german')}</button>
                  <button className="lang-option" onClick={() => { changeLanguage('en'); setLangDropdownOpen(false); }} style={{ fontWeight: i18n.language === 'en' ? 700 : 500 }}>{t('english')}</button>
                </div>
              )}
            </div>
            <button className="nav-action" onClick={logout}>
              <LogOut size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              <label className="nav-label">{t('logout')}</label>
            </button>
          </>
        )}
      </nav>

    </header>
  );
};

export default Header;
