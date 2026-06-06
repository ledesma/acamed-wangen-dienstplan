import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageSquare, PencilIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Shift, Task, RosterEntry } from '../types';
import api, { dayCommentApi } from '../data/api';
import { getWeekDates, formatDate, isToday, getDayName, formatShiftTimes, getMonthName } from '../utils/dateUtils';
import { getTaskIcon } from '../utils/iconUtils';

const DraggableLegendItem: React.FC<{ shift: Shift; isAdmin: boolean }> = ({ shift, isAdmin }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isAdmin) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ shiftId: shift.id, shift }));
    e.dataTransfer.effectAllowed = 'copy';
    ref.current?.classList.add('dragging');
  };

  const handleDragEnd = () => {
    ref.current?.classList.remove('dragging');
  };

  return (
    <div
      ref={ref}
      draggable={isAdmin}
      className={`legend-item ${!isAdmin ? 'legend-item-disabled' : ''}`}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="legend-color" style={{ backgroundColor: shift.color }} />
      <div className="legend-info">
        <span className="legend-name">{shift.name}</span>
        <span className="legend-time">{formatShiftTimes(shift.times)}</span>
      </div>
    </div>
  );
};

const DroppableCell: React.FC<{
  employeeId: string;
  date: string;
  entry: RosterEntry | undefined;
  shift: Shift | undefined;
  tasks: Task[];
  isAdmin: boolean;
  isWeekend: boolean;
  onSaveTasks: (employeeId: string, date: string, taskIds: string[]) => void;
  onShiftDrop: (employeeId: string, date: string, shiftId: string) => void;
  onClearCell: (employeeId: string, date: string) => void;
}> = ({ employeeId, date, entry, shift, tasks, isAdmin, isWeekend, onSaveTasks, onShiftDrop, onClearCell }) => {
  const { t } = useTranslation();
  const [isOver, setIsOver] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const activeTasks = entry?.activeTaskIds || [];

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
        onShiftDrop(employeeId, date, data.shiftId);
      }
    } catch {
      // ignore parse errors
    }
  };

  const handleClick = () => {
    if (isAdmin && entry?.shiftId) {
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
    onSaveTasks(employeeId, date, selectedTaskIds);
    setShowTaskEditor(false);
  };

  const handleClearCell = () => {
    onClearCell(employeeId, date);
    setShowTaskEditor(false);
  };

  return (
    <>
      <div
        className={`day-cell ${isOver ? 'drag-over' : ''} ${isWeekend ? 'weekend' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {shift && (
          <div className="day-cell-content">
            <div className="shift-indicator" style={{ backgroundColor: shift.color }}>
              {shift.name}
            </div>
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
            <h3>{t('editCell')} - {employeeId} / {date}</h3>
            
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

const DayHeader: React.FC<{ date: Date; isAdmin: boolean; onCommentClick: () => void; dayComment?: string }> = ({ 
  date, 
  isAdmin, 
  onCommentClick,
  dayComment 
}) => {
  return (
    <div className={`week-header-cell ${isToday(date) ? 'today' : ''}`}>
      <div>{getDayName(date, true)}, {date.getDate()}</div>
      <div className="day-comment-text" title={dayComment}>
      <span>{dayComment}</span>
      {isAdmin && (
        <button 
          className="day-comment-btn" 
          onClick={onCommentClick}
          title="Add day comment"
        >
          <PencilIcon size={12} />
        </button>
        )}
      </div>
    </div>
  );
};

const Roster: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, employees, refreshEmployees } = useAuth();
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
  const [showCommentEditor, setShowCommentEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [commentText, setCommentText] = useState('');

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    refreshEmployees();
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const handleShiftDrop = async (employeeId: string, date: string, shiftId: string) => {
    await assignShift(employeeId, date, shiftId);
  };

  const assignShift = async (employeeId: string, date: string, shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const existingEntry = entries.find(e => e.employeeId === employeeId && e.date === date);
    
    const entryData = {
      employeeId,
      date,
      shiftId,
      activeTaskIds: shift.defaultTaskIds
    };

    if (existingEntry) {
      await api.updateRosterEntry(existingEntry.id, entryData);
    } else {
      await api.createRosterEntry(entryData);
    }

    await refreshEmployees();
    await loadData();
  };

  const toggleTask = async (employeeId: string, date: string, taskId: string) => {
    const entry = entries.find(e => e.employeeId === employeeId && e.date === date);
    if (!entry) return;

    const activeTaskIds = entry.activeTaskIds.includes(taskId)
      ? entry.activeTaskIds.filter(id => id !== taskId)
      : [...entry.activeTaskIds, taskId];

    await api.updateRosterEntry(entry.id, { activeTaskIds });
    await refreshEmployees();
    await loadData();
  };

  const saveTasks = async (employeeId: string, date: string, taskIds: string[]) => {
    const entry = entries.find(e => e.employeeId === employeeId && e.date === date);
    if (!entry) return;

    await api.updateRosterEntry(entry.id, { activeTaskIds: taskIds });
    await refreshEmployees();
    await loadData();
  };

  const clearCell = async (employeeId: string, date: string) => {
    const entry = entries.find(e => e.employeeId === employeeId && e.date === date);
    if (!entry) return;

    await api.updateRosterEntry(entry.id, { shiftId: null, activeTaskIds: [] });
    await refreshEmployees();
    await loadData();
  };

  const openCommentEditor = (date: string) => {
    setSelectedDate(date);
    setCommentText(dayComments[date] || '');
    setShowCommentEditor(true);
  };

  const saveComment = async () => {
    await dayCommentApi.setComment(selectedDate, commentText);
    await loadData();
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

  const getEntryForCell = (employeeId: string, date: string) => {
    return entries.find(e => e.employeeId === employeeId && e.date === date);
  };

  const getShiftForEntry = (entry: RosterEntry | undefined) => {
    if (!entry?.shiftId) return undefined;
    return shifts.find(s => s.id === entry.shiftId);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
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
              onCommentClick={() => openCommentEditor(formatDate(date))}
              dayComment={dayComments[formatDate(date)]}
            />
          ))}

          {employees.map(employee => (
            <React.Fragment key={employee.id}>
              <div className="employee-cell">
                <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </div>
                {employee.name}
              </div>
              {weekDates.map((date, index) => {
                const dateStr = formatDate(date);
                const entry = getEntryForCell(employee.id, dateStr);
                const shift = getShiftForEntry(entry);
                const isWeekend = index >= 5;
                
                return (
                  <DroppableCell
                    key={`${employee.id}-${dateStr}`}
                    employeeId={employee.id}
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

        <div className="legend">
          {shifts.filter(s => s.isActive).map(shift => (
            <DraggableLegendItem key={shift.id} shift={shift} isAdmin={isAdmin} />
          ))}
        </div>
       </div>

      {showCommentEditor && (
        <div className="task-editor-overlay">
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
              <button className="btn btn-danger" onClick={() => {
                setCommentText('');
                saveComment();
              }}>
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