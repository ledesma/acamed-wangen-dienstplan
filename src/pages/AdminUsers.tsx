import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { UserRecord } from '../types';
import api from '../data/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { refreshUsers, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{success: boolean; message: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: [] as string[]
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    
    if (editingUser) {
      const filteredRoles = formData.roles.filter(r => r === 'admin' || r === 'employee');
      await api.updateUser(editingUser.id, { ...formData, roles: filteredRoles });
      setInviteStatus({ success: true, message: 'User updated' });
    } else {
      try {
        const result = await api.inviteUser(formData.name, formData.email, formData.roles as ('admin' | 'employee')[]);
        if (result.inviteSent) {
          setInviteStatus({ success: true, message: `${t('inviteSentTo')} ${formData.email}` });
        } else {
          setInviteStatus({ success: true, message: `${t('userAdded')} (${t('inviteUnavailableLocal')})` });
        }
      } catch (err: any) {
        setInviteStatus({ success: false, message: err.message });
        return;
      }
    }
    
    await loadUsers();
    await refreshUsers();
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', roles: [] });
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      roles: [...(user.roles || [])]
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteUser'))) {
      await api.deleteUser(id);
      await loadUsers();
   await refreshUsers();
    }
  };

  const openNewModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', roles: [] });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-title">{t('admin')}</div>
        <nav className="sidebar-nav">
          <Link
            to="/admin/users"
            className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            <Users size={18} />
            {t('users')}
          </Link>
          <Link
            to="/admin/shifts"
            className={`sidebar-link ${location.pathname === '/admin/shifts' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            {t('shifts')}
          </Link>
          <Link
            to="/admin/tasks"
            className={`sidebar-link ${location.pathname === '/admin/tasks' ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            {t('tasks')}
          </Link>
        </nav>
      </aside>

      <div className="admin-content">
        <div className="card-header" style={{ marginBottom: 24 }}>
          <h1 className="page-title">{t('users')}</h1>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            {t('addUser')}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('email')}</th>
              <th>{t('roles')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(user.roles || []).map(r => (
                      <span key={r} style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        background: r === 'admin' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                        color: r === 'admin' ? 'white' : 'var(--color-text-primary)'
                      }}>
                        {t(r)}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  {user.inviteSent && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      background: 'var(--color-success)',
                      color: 'white',
                      marginRight: 8
                    }}>
                      {t('inviteSent')}
                    </span>
                  )}
                  <div className="table-actions">
                    <button className="btn-icon" onClick={() => handleEdit(user)}>
                      <Edit2 size={16} />
                    </button>
                    {currentUser?.email !== user.email && (
                      <button className="btn-icon" onClick={() => handleDelete(user.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <Modal
            title={editingUser ? t('editUser') : t('addUser')}
            onClose={() => setShowModal(false)}
          >
            <form onSubmit={handleSubmit}>
              {inviteStatus && (
                <div className={inviteStatus.success ? 'success-message' : 'error-message'}>
                  {inviteStatus.message}
                </div>
              )}
              <div className="form-group">
                <label className="label">{t('name')}</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t('email')}</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t('roles')}</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: editingUser?.id === currentUser?.id && formData.roles.includes('admin') ? 0.5 : 1 }}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('admin')}
                      disabled={editingUser?.email === currentUser?.email && formData.roles.includes('admin')}
                      onChange={e => {
                        const roles = e.target.checked
                          ? [...formData.roles, 'admin']
                          : formData.roles.filter(r => r !== 'admin');
                        setFormData({ ...formData, roles });
                      }}
                    />
                    {t('admin')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes('employee')}
                      onChange={e => {
                        const roles = e.target.checked
                          ? [...formData.roles, 'employee']
                          : formData.roles.filter(r => r !== 'employee');
                        setFormData({ ...formData, roles });
                      }}
                    />
                    {t('employee')}
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 24, border: 'none' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? t('saveChanges') : t('addUser')}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;