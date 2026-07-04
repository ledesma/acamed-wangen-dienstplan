import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { UserRecord } from '../types';
import api from '../data/api';

interface UserOrderListProps {
  users: UserRecord[];
  onChange: (updatedUsers: UserRecord[]) => void;
}

const UserOrderList: React.FC<UserOrderListProps> = ({ users, onChange }) => {
  const { t } = useTranslation();
  const [usersState, setUsersState] = useState<UserRecord[]>(users);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const moved = [...usersState];
    const [removed] = moved.splice(dragIndex, 1);
    moved.splice(dragOverIndex, 0, removed);

    setUsersState(moved);
    setDragIndex(null);
    setDragOverIndex(null);

    const updated = moved.map((u, i) => ({ ...u, display_order: i + 1 }));
    setUsersState(updated);
    onChange(updated);
  }, [dragIndex, dragOverIndex, usersState, onChange]);

  const handleOrderChange = useCallback(async (index: number, newOrder: number) => {
    const updated = [...usersState];
    updated[index] = { ...updated[index], display_order: newOrder };
    setUsersState(updated);
    onChange(updated);
  }, [usersState, onChange]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const ids = usersState.map(u => u.id);
      await api.reorderUsers(ids);
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSaving(false);
    }
  }, [usersState]);

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('saving') : t('saveOrder')}
        </button>
      </div>

      <div className="user-order-list">
        {usersState.map((user, index) => (
          <div
            key={user.id}
            className={`user-order-row ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="user-order-drag-handle">
              <GripVertical size={18} />
            </div>

            <div className="user-order-number">
              <input
                type="number"
                min={1}
                max={usersState.length}
                value={user.display_order}
                onChange={(e) => handleOrderChange(index, parseInt(e.target.value, 10))}
                className="user-order-input"
              />
            </div>

            <div className="user-order-name">{user.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrderList;
