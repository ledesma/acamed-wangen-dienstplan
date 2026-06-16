import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Shift, Task, RosterEntry } from '../types';
import api, { dayCommentApi } from '../data/api';
import { getWeekDates, formatDate, isToday, getDayName, getMonthName } from '../utils/dateUtils';
import { getTaskIcon } from '../utils/iconUtils';
import Legend from '../components/Legend';

const DroppableCell: React.FC<{
  userId: string;
  date: string;
  entry: RosterEntry | undefined;
  shift: Shift | undefined;
  tasks: Task[];
  isAdmin: boolean;
  isWeekend: boolean;
  onSaveTasks: (userId: string, date: string, taskIds: string[]) => void;
  onShiftDrop: (userId: string, date: string, shiftId: string) => void;
  onClearCell: (userId: string, date: string) => void;
}> = ({ userId, date, entry, shift, tasks, isAdmin, isWeekend, onSaveTasks, onShiftDrop, onClearCell }) => {
  const { t } = useTranslation();
  const [isOver, setIsOver] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const activeTasks = entry?.active_task_ids || [];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.shiftId && isAdmin) {
        onShiftDrop(userId, date, data.shiftId);
      }
    } catch {
      // ignore parse errors
    }
  };

  const handleClick = () => {
    if (isAdmin && entry?.shift_id) {
      setSelectedTaskIds([...activeTasks]);
      setShowTaskEditor(true);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSave = () => {
    onSaveTasks(userId, date, selectedTaskIds);
    setShowTaskEditor(false);
  };

  const handleClearCell = () => {
    onClearCell(userId, date);
    setShowTaskEditor(false);
  };

  return (
    <>
      <div
        className={`day-cell ${isOver ? 'drag-over' : ''} ${isWeekend ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
        style={shift ? { backgroundColor: shift.color + '30', border: `2px solid ${shift.color}` } : {}}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {shift && (
          <div className="day-cell-content">
            {activeTasks.length > 0 && (
              <div className="task-icons">
                {activeTasks.map(taskId => {
                  const task = tasks.find(t => t.id === taskId);
                  return task ? (
                    <div
                      key={taskId}
                      className="task-icon"
                      title={task.name}
                    >
                      <span className="material-symbols-rounded">{getTaskIcon(task.icon)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showTaskEditor && isAdmin && (
        <div className="task-editor-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowTaskEditor(false);
          }
        }}>
          <div className="task-editor">
            <h3>{t('editCell')} - {userId} / {date}</h3>
            
            <div className="form-group">
              <label className="label">{t('tasks')}</label>
              <div className="task-grid">
                {tasks.map(task => (
                  <label key={task.id} className="task-item">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                    />
                    <span><span className="material-symbols-rounded">{getTaskIcon(task.icon)}</span> {task.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="task-editor-actions task-editor-actions-right">
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setShowTaskEditor(false)}>
                  {t('close')}
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {t('save')}
                </button>
              </div>
            </div>
            <hr className="task-editor-divider" />
            <div className="task-editor-actions task-editor-actions-right">
              <div className="btn-group">
                <button className="btn btn-danger" onClick={handleClearCell}>
                  {t('clearCell')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DayHeader: React.FC<{ date: Date; isAdmin: boolean; footnoteIndex?: number; onCommentClick: () => void }> = ({ 
  date, 
  isAdmin, 
  footnoteIndex,
  onCommentClick
}) => {
  return (
    <div className={`week-header-cell ${isToday(date) ? 'today' : ''} ${isAdmin ? 'clickable' : ''}`} onClick={isAdmin ? onCommentClick : undefined}>
      <div className="header-top">
        <span className="title">{getDayName(date, true)}, {date.getDate()}</span>
        {footnoteIndex !== undefined && (
          <span className="footnote-marker">{footnoteIndex})</span>
        )}
      </div>
    </div>
  );
};

const Roster: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, users, refreshUsers } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
 const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [dayComments, setDayComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentEditor, setShowCommentEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [commentText, setCommentText] = useState('');

  const shiftsRef = useRef(shifts);
  const entriesRef = useRef(entries);
  shiftsRef.current = shifts;
  entriesRef.current = entries;

  const weekDates = getWeekDates(currentWeekStart);
  const rosterUsers = users.filter(u => u.roles?.includes('employee'));

  const footnoteMap: Record<string, number> = {};
  let footnoteCounter = 0;
  for (const date of weekDates) {
    const dateStr = formatDate(date);
    if (dayComments[dateStr]) {
      footnoteCounter++;
      footnoteMap[dateStr] = footnoteCounter;
    }
  }

  useEffect(() => {
    refreshUsers();
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsData, tasksData, entriesData, commentsData] = await Promise.all([
        api.getShifts(),
        api.getTasks(),
        api.getRosterEntries(),
        dayCommentApi.getComments()
      ]);
      setShifts(shiftsData);
      setTasks(tasksData);
      setEntries(entriesData);
      setDayComments(commentsData || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftDrop = async (userId: string, date: string, shiftId: string) => {
    await assignShift(userId, date, shiftId);
  };

  const assignShift = async (userId: string, date: string, shiftId: string) => {
    const currentShifts = shiftsRef.current;
    const currentEntries = entriesRef.current;
    const shift = currentShifts.find(s => s.id === shiftId);
    if (!shift) return;

    const existingEntry = currentEntries.find(e => e.user_id === userId && e.date === date);
    
    if (existingEntry) {
      await api.updateRosterEntry(existingEntry.id, {
        userId,
        date,
        shiftId,
        activeTaskIds: shift.default_task_ids
      });
      setEntries(prev => prev.map(e => e.id === existingEntry.id ? {
        id: e.id,
        user_id: e.user_id,
        date: e.date,
        shift_id: shiftId,
        active_task_ids: shift.default_task_ids
      } : e));
    } else {
      const entryData = {
        userId,
        date,
        shiftId,
        activeTaskIds: shift.default_task_ids
      };
      const result = await api.createRosterEntry(entryData);
      const newEntry: RosterEntry = {
        id: result?.id || `temp-${Date.now()}`,
        user_id: userId,
        date: date,
        shift_id: shiftId,
        active_task_ids: shift.default_task_ids
      };
      setEntries(prev => [...prev, newEntry]);
    }
  };

  const toggleTask = async (userId: string, date: string, taskId: string) => {
    const entry = entriesRef.current.find(e => e.user_id === userId && e.date === date);
    if (!entry) return;

    const activeTaskIds = entry.active_task_ids.includes(taskId)
      ? entry.active_task_ids.filter(id => id !== taskId)
      : [...entry.active_task_ids, taskId];

    await api.updateRosterEntry(entry.id, { activeTaskIds });
    setEntries(prev => prev.map(e => e.id === entry.id ? {
      id: e.id,
      user_id: e.user_id,
      date: e.date,
      shift_id: e.shift_id,
      active_task_ids: activeTaskIds
    } : e));
  };

  const saveTasks = async (userId: string, date: string, taskIds: string[]) => {
    const entry = entriesRef.current.find(e => e.user_id === userId && e.date === date);
    if (!entry) return;

    await api.updateRosterEntry(entry.id, { activeTaskIds: taskIds });
    setEntries(prev => prev.map(e => e.id === entry.id ? {
      id: e.id,
      user_id: e.user_id,
      date: e.date,
      shift_id: e.shift_id,
      active_task_ids: taskIds
    } : e));
  };

  const clearCell = async (userId: string, date: string) => {
    const entry = entriesRef.current.find(e => e.user_id === userId && e.date === date);
    if (!entry) return;

    await api.deleteRosterEntry(entry.id);
    setEntries(prev => prev.filter(e => e.id !== entry.id));
  };

  const openCommentEditor = (date: string) => {
    setSelectedDate(date);
    setCommentText(dayComments[date] || '');
    setShowCommentEditor(true);
  };

  const saveComment = async () => {
    await dayCommentApi.setComment(selectedDate, commentText);
    setDayComments(prev => ({ ...prev, [selectedDate]: commentText }));
    setShowCommentEditor(false);
  };

  const clearComment = async () => {
    await dayCommentApi.deleteComment(selectedDate);
    setDayComments(prev => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setShowCommentEditor(false);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const getEntryForCell = (userId: string, date: string) => {
    return entries.find(e => e.user_id === userId && e.date === date);
  };

  const getShiftForEntry = (entry: RosterEntry | undefined) => {
    if (!entry?.shift_id) return undefined;
    return shifts.find(s => s.id === entry.shift_id);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" style={{ padding: 24, textAlign: 'center' }}>
        <h2>Failed to load data</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: 16 }}>
          <RefreshCw size={18} /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="roster-container">
        <div className="roster-header">
          <button className="btn btn-secondary" onClick={loadData} title={t('refresh')}>
            <RefreshCw size={18} />
          </button>

          <div className="roster-nav">
            <button className="btn btn-secondary" onClick={() => navigateWeek(-1)}>
              <ChevronLeft size={18} />
            </button>
            <span className="roster-title">
              {getMonthName(weekDates[0])} {weekDates[0].getFullYear().toString()}
            </span>
            <button className="btn btn-secondary" onClick={() => navigateWeek(1)}>
              <ChevronRight size={18} />
            </button>
          </div>

          <button className="btn btn-secondary" onClick={goToToday}>
            {t('today')}
          </button>
        </div>

        <div className="week-grid">
          <div className="week-header-cell"></div>
          {weekDates.map(date => (
            <DayHeader 
              key={date.toISOString()} 
              date={date} 
              isAdmin={isAdmin}
              footnoteIndex={footnoteMap[formatDate(date)]}
              onCommentClick={() => openCommentEditor(formatDate(date))}
            />
          ))}

          {rosterUsers.map(user => (
            <React.Fragment key={user.id}>
              <div className="employee-cell">
                {user.name}
              </div>
              {weekDates.map((date, index) => {
                const dateStr = formatDate(date);
                const entry = getEntryForCell(user.id, dateStr);
                const shift = getShiftForEntry(entry);
                const isWeekend = index >= 5;
                
                return (
                  <DroppableCell
                    key={`${user.id}-${dateStr}`}
                    userId={user.id}
                    date={dateStr}
                    entry={entry}
                    shift={shift}
                    tasks={tasks}
                    isAdmin={isAdmin}
                    isWeekend={isWeekend}
                    onSaveTasks={saveTasks}
                    onShiftDrop={handleShiftDrop}
                    onClearCell={clearCell}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <Legend
          shifts={shifts}
          tasks={tasks}
          draggable={isAdmin}
        />

        {Object.keys(footnoteMap).length > 0 && (
          <div className="roster-footnotes">
            {Object.entries(footnoteMap).map(([dateStr, index]) => (
              <div key={dateStr} className="footnote-item">
                <span className="footnote-number">{index})</span>
                <span className="footnote-date">{getDayName(new Date(dateStr + 'T00:00:00'), true)}, {new Date(dateStr + 'T00:00:00').getDate()}.{(new Date(dateStr + 'T00:00:00').getMonth() + 1).toString().padStart(2, '0')}.{new Date(dateStr + 'T00:00:00').getFullYear()}:</span>
                <span className="footnote-text">{dayComments[dateStr]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCommentEditor && (
        <div className="task-editor-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCommentEditor(false);
          }
        }}>
          <div className="task-editor">
            <h3>Day Comment - {selectedDate}</h3>
            
            <div className="form-group">
              <label className="label">Comment</label>
              <input
                type="text"
                className="input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Enter comment for this day..."
              />
            </div>
            
            <div className="task-editor-actions">
               <button className="btn btn-danger" onClick={clearComment}>
                 Clear
               </button>
              <button className="btn btn-primary" onClick={saveComment}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Roster;