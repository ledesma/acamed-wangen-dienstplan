import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CheckSquare, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { Shift, Task } from '../types';
import api from '../data/api';
import Modal from '../components/Modal';
import { formatShiftTimes } from '../utils/dateUtils';

const COLORS = [
  '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const AdminShifts: React.FC = () => {
  const location = useLocation();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    times: [{ from: '08:00', to: '16:00' }],
    color: COLORS[0],
    defaultTaskIds: [] as string[],
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [shiftsData, tasksData] = await Promise.all([
      api.getShifts(),
      api.getTasks()
    ]);
    setShifts(shiftsData);
    setTasks(tasksData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const shiftData = {
      ...formData,
      times: formData.times.filter(t => t.from && t.to)
    };
    
    if (editingShift) {
      await api.updateShift(editingShift.id, shiftData);
    } else {
      await api.createShift(shiftData);
    }
    
    await loadData();
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      times: shift.times.length > 0 ? shift.times : [{ from: '08:00', to: '16:00' }],
      color: shift.color,
      defaultTaskIds: shift.defaultTaskIds,
      isActive: shift.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      await api.deleteShift(id);
      await loadData();
    }
  };

  const resetForm = () => {
    setEditingShift(null);
    setFormData({
      name: '',
      times: [{ from: '08:00', to: '16:00' }],
      color: COLORS[0],
      defaultTaskIds: [],
      isActive: true
    });
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      times: [...formData.times, { from: '08:00', to: '16:00' }]
    });
  };

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    });
  };

  const updateTimeSlot = (index: number, field: 'from' | 'to', value: string) => {
    const newTimes = [...formData.times];
    newTimes[index][field] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const toggleTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultTaskIds: prev.defaultTaskIds.includes(taskId)
        ? prev.defaultTaskIds.filter(id => id !== taskId)
        : [...prev.defaultTaskIds, taskId]
    }));
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
          <h1 className="page-title">Shifts</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} />
            Add Shift
          </button>
        </div>

        <div className="grid-3">
          {shifts.map(shift => (
            <div key={shift.id} className="card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-color" style={{ backgroundColor: shift.color }} />
                  {shift.name}
                </div>
                <div className="table-actions">
                  <button className="btn-icon" onClick={() => handleEdit(shift)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(shift.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="card-description">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Clock size={14} />
                  {formatShiftTimes(shift.times)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {shift.defaultTaskIds.length} default tasks
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <Modal
            title={editingShift ? 'Edit Shift' : 'Add Shift'}
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
                <label className="label">Work Times</label>
                <div className="shift-times-list">
                  {formData.times.map((time, index) => (
                    <div key={index} className="shift-time-item">
                      <input
                        type="time"
                        className="input"
                        value={time.from}
                        onChange={e => updateTimeSlot(index, 'from', e.target.value)}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        className="input"
                        value={time.to}
                        onChange={e => updateTimeSlot(index, 'to', e.target.value)}
                      />
                      {formData.times.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon remove-time-btn"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addTimeSlot}
                  style={{ marginBottom: 16 }}
                >
                  <Plus size={16} />
                  Add Time Slot
                </button>
              </div>

              <div className="form-group">
                <label className="label">Color</label>
                <div className="color-picker">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Default Active Tasks</label>
                <div className="task-grid">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-item ${formData.defaultTaskIds.includes(task.id) ? 'selected' : ''}`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={formData.defaultTaskIds.includes(task.id)}
                        onChange={() => {}}
                      />
                      <span>{task.name}</span>
                    </div>
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
                  {editingShift ? 'Save Changes' : 'Add Shift'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminShifts;