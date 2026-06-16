import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const links = [
    { to: '/admin/users', icon: Users, label: t('users') },
    { to: '/admin/shifts', icon: Calendar, label: t('shifts') },
    { to: '/admin/tasks', icon: CheckSquare, label: t('tasks') },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
