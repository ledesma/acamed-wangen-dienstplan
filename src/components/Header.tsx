import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Calendar, User, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-title">Acamed Calendar</div>
      
      <nav className="header-nav">
        <Link 
          to="/calendar" 
          className={isActive('/calendar') ? 'active' : ''}
        >
          <Calendar size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Team Calendar
        </Link>
        <Link 
          to="/my-calendar" 
          className={isActive('/my-calendar') ? 'active' : ''}
        >
          <User size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          My Calendar
        </Link>
        {isAdmin && (
          <Link 
            to="/admin/employees" 
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
          >
            <Settings size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Admin
          </Link>
        )}
      </nav>

      <div className="header-actions">
        <button 
          className="btn-icon" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {user && (
          <div className="user-menu">
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <span style={{ fontWeight: 500 }}>{user.name}</span>
            <button className="btn-icon" onClick={logout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;