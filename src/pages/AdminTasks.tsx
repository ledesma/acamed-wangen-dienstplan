import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { Task } from '../types';
import api from '../data/api';
import Modal from '../components/Modal';

const ICONS = [
  'Heart', 'FileText', 'AlertTriangle', 'Users', 'GraduationCap',
  'Clipboard', 'Clock', 'Stethoscope', 'Thermometer', 'Pill',
  'Syringe', 'Activity', 'Brain', 'Eye', 'Bone'
];

const ICON_DISPLAYS: Record<string, string> = {
  Heart: '♥',
  FileText: '📄',
  AlertTriangle: '⚠',
  Users: '👥',
  GraduationCap: '🎓',
  Clipboard: '📋',
  Clock: '🕐',
  Stethoscope: '🩺',
  Thermometer: '🌡️',
  Pill: '💊',
  Syringe: '💉',
  Activity: '📊',
  Brain: '🧠',
  Eye: '👁️',
  Bone: '🦴'
};

const AdminTasks: React.FC = () => {
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Heart',
    isActive: true
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const data = await api.getTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      await api.updateTask(editingTask.id, formData);
    } else {
      await api.createTask(formData);
    }
    
    await loadTasks();
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      icon: task.icon,
      isActive: task.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await api.deleteTask(id);
      await loadTasks();
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      icon: 'Heart',
      isActive: true
    });
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
          <h1 className="page-title">Tasks</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} />
            Add Task
          </button>
        </div>

        <div className="grid-3">
          {tasks.map(task => (
            <div key={task.id} className="card">
              <div className="card-header">
                <div className="card-title">
                  <span style={{ fontSize: '1.5rem' }}>{ICON_DISPLAYS[task.icon] || '•'}</span>
                  {task.name}
                </div>
                <div className="table-actions">
                  <button className="btn-icon" onClick={() => handleEdit(task)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(task.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="card-description">
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  background: task.isActive ? 'var(--color-success)' : 'var(--color-surface-elevated)',
                  color: task.isActive ? 'white' : 'var(--color-text-secondary)'
                }}>
                  {task.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <Modal
            title={editingTask ? 'Edit Task' : 'Add Task'}
            onClose={() => { setShowModal(false); resetForm(); }}
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
                <label className="label">Icon</label>
                <div className="icon-picker">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                      title={icon}
                    >
                      {ICON_DISPLAYS[icon] || '•'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 24, border: 'none' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminTasks;