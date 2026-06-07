import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { Employee } from '../types';
import api from '../data/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AdminEmployees: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { refreshEmployees } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{success: boolean; message: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const data = await api.getEmployees();
    setEmployees(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    
    if (editingEmployee) {
      await api.updateEmployee(editingEmployee.id, formData);
      setInviteStatus({ success: true, message: 'Employee updated' });
    } else {
      try {
        const result = await api.inviteEmployee(formData.name, formData.email, formData.role);
        if (result.inviteSent) {
          setInviteStatus({ success: true, message: `${t('inviteSentTo')} ${formData.email}` });
        } else {
          setInviteStatus({ success: true, message: `${t('employeeAdded')} (${t('inviteUnavailableLocal')})` });
        }
      } catch (err: any) {
        setInviteStatus({ success: false, message: err.message });
        return;
      }
    }
    
    await loadEmployees();
    await refreshEmployees();
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({ name: '', email: '', role: 'user' });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteEmployee'))) {
      await api.deleteEmployee(id);
      await loadEmployees();
      await refreshEmployees();
    }
  };

  const openNewModal = () => {
    setEditingEmployee(null);
    setFormData({ name: '', email: '', role: 'user' });
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
            to="/admin/employees"
            className={`sidebar-link ${location.pathname === '/admin/employees' ? 'active' : ''}`}
          >
            <Users size={18} />
            {t('employees')}
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
          <h1 className="page-title">{t('employees')}</h1>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            {t('addEmployee')}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('email')}</th>
              <th>{t('role')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {emp.name}
                  </div>
                </td>
                <td>{emp.email}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    background: emp.role === 'admin' ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                    color: emp.role === 'admin' ? 'white' : 'var(--color-text-primary)'
                  }}>
                    {t(emp.role)}
                  </span>
                </td>
                <td>
                  {emp.inviteSent && (
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
                    <button className="btn-icon" onClick={() => handleEdit(emp)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(emp.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <Modal
            title={editingEmployee ? t('editEmployee') : t('addEmployee')}
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
                <label className="label">{t('role')}</label>
                <select
                  className="select"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                >
                  <option value="user">{t('user')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 24, border: 'none' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? t('saveChanges') : t('addEmployee')}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminEmployees;