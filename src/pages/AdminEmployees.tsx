import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { Employee } from '../types';
import api from '../data/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const AdminEmployees: React.FC = () => {
  const location = useLocation();
  const { refreshEmployees } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
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
    
    if (editingEmployee) {
      await api.updateEmployee(editingEmployee.id, formData);
    } else {
      await api.createEmployee(formData);
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
    if (confirm('Are you sure you want to delete this employee?')) {
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
        <div className="sidebar-title">Administration</div>
        <nav className="sidebar-nav">
          <Link
            to="/admin/employees"
            className={`sidebar-link ${location.pathname === '/admin/employees' ? 'active' : ''}`}
          >
            <Users size={18} />
            Employees
          </Link>
          <Link
            to="/admin/shifts"
            className={`sidebar-link ${location.pathname === '/admin/shifts' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            Shifts
          </Link>
          <Link
            to="/admin/tasks"
            className={`sidebar-link ${location.pathname === '/admin/tasks' ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            Tasks
          </Link>
        </nav>
      </aside>

      <div className="admin-content">
        <div className="card-header" style={{ marginBottom: 24 }}>
          <h1 className="page-title">Employees</h1>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            Add Employee
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
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
                    {emp.role}
                  </span>
                </td>
                <td>
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
            title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
            onClose={() => setShowModal(false)}
          >
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Role</label>
                <select
                  className="select"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 24, border: 'none' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
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