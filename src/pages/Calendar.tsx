import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { useAuth } from '../context/AuthContext';
import { Shift, Task, CalendarEntry } from '../types';
import api, { dayCommentApi } from '../data/api';
import { getWeekDates, formatDate, isToday, getDayName, formatShiftTimes } from '../utils/dateUtils';

const DraggableLegendItem: React.FC<{ shift: Shift; isAdmin: boolean }> = ({ shift, isAdmin }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `legend-${shift.id}`,
    data: { shift },
    disabled: !isAdmin
  });

  return (
    <div
      ref={setNodeRef}
      className={`legend-item ${isDragging ? 'dragging' : ''} ${!isAdmin ? 'legend-item-disabled' : ''}`}
      {...(isAdmin ? { ...listeners, ...attributes } : {})}
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
  entry: CalendarEntry | undefined;
  shift: Shift | undefined;
  tasks: Task[];
  isAdmin: boolean;
  onToggleTask: (employeeId: string, date: string, taskId: string) => void;
}> = ({ employeeId, date, entry, shift, tasks, isAdmin, onToggleTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${employeeId}-${date}`,
    data: { employeeId, date }
  });

  const [showTaskEditor, setShowTaskEditor] = React.useState(false);

  const activeTasks = entry?.activeTaskIds || [];
  
  const handleClick = () => {
    if (isAdmin && entry?.shiftId) {
      setShowTaskEditor(true);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    onToggleTask(employeeId, date, taskId);
  };

  const getTaskIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Heart: '♥',
      FileText: '📄',
      AlertTriangle: '⚠',
      Users: '👥',
      GraduationCap: '🎓',
      Clipboard: '📋'
    };
    return icons[iconName] || '•';
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`day-cell ${isOver ? 'drag-over' : ''} ${isToday(new Date(date + 'T00:00:00')) ? 'today' : ''}`}
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
                    {getTaskIcon(task.icon)}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
      
      {showTaskEditor && isAdmin && (
        <div className="task-editor-overlay" onClick={() => setShowTaskEditor(false)}>
          <div className="task-editor" onClick={e => e.stopPropagation()}>
            <h3>Edit Tasks - {employeeId} / {date}</h3>
            
            <div className="form-group">
              <label className="label">Tasks</label>
              <div className="task-grid">
                {tasks.map(task => (
                  <label key={task.id} className="task-item" onClick={(e) => e.preventDefault()}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={activeTasks.includes(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                    />
                    <span>{getTaskIcon(task.icon)} {task.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="task-editor-actions">
              <button className="btn btn-secondary" onClick={() => setShowTaskEditor(false)}>
                Close
              </button>
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
      <div>{getDayName(date, true)}</div>
      <div className="week-header-date">{date.getDate()}</div>
      {isAdmin && (
        <button 
          className="day-comment-btn" 
          onClick={onCommentClick}
          title="Add day comment"
        >
          <MessageSquare size={12} />
        </button>
      )}
      {dayComment && (
        <div className="day-comment-indicator" title={dayComment}>💬</div>
      )}
    </div>
  );
};

const Calendar: React.FC = () => {
  const { isAdmin, employees } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [dayComments, setDayComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCommentEditor, setShowCommentEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [commentText, setCommentText] = useState('');

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [shiftsData, tasksData, entriesData, commentsData] = await Promise.all([
      api.getShifts(),
      api.getTasks(),
      api.getCalendarEntries(),
      dayCommentApi.getComments()
    ]);
    setShifts(shiftsData);
    setTasks(tasksData);
    setEntries(entriesData);
    setDayComments(commentsData || {});
    setLoading(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const shiftData = active.data.current?.shift;
    const cellData = over.data.current;

    if (shiftData && cellData && isAdmin) {
      const { employeeId, date } = cellData;
      await assignShift(employeeId, date, shiftData.id);
    }
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
      await api.updateCalendarEntry(existingEntry.id, entryData);
    } else {
      await api.createCalendarEntry(entryData);
    }

    await loadData();
  };

  const removeShift = async (employeeId: string, date: string) => {
    const entry = entries.find(e => e.employeeId === employeeId && e.date === date);
    if (entry) {
      await api.updateCalendarEntry(entry.id, { shiftId: null, activeTaskIds: [] });
      await loadData();
    }
  };

  const toggleTask = async (employeeId: string, date: string, taskId: string) => {
    const entry = entries.find(e => e.employeeId === employeeId && e.date === date);
    if (!entry) return;

    const activeTaskIds = entry.activeTaskIds.includes(taskId)
      ? entry.activeTaskIds.filter(id => id !== taskId)
      : [...entry.activeTaskIds, taskId];

    await api.updateCalendarEntry(entry.id, { activeTaskIds });
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

  const getShiftForEntry = (entry: CalendarEntry | undefined) => {
    if (!entry?.shiftId) return undefined;
    return shifts.find(s => s.id === entry.shiftId);
  };

  const activeShift = activeId ? shifts.find(s => `legend-${s.id}` === activeId) : null;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="btn btn-secondary" onClick={() => navigateWeek(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-secondary" onClick={goToToday}>
              Today
            </button>
            <button className="btn btn-secondary" onClick={() => navigateWeek(1)}>
              <ChevronRight size={18} />
            </button>
            <span className="calendar-title">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="week-grid">
          <div className="week-header-cell">Employee</div>
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
              {weekDates.map(date => {
                const dateStr = formatDate(date);
                const entry = getEntryForCell(employee.id, dateStr);
                const shift = getShiftForEntry(entry);
                
                return (
                  <DroppableCell
                    key={`${employee.id}-${dateStr}`}
                    employeeId={employee.id}
                    date={dateStr}
                    entry={entry}
                    shift={shift}
                    tasks={tasks}
                    isAdmin={isAdmin}
                    onToggleTask={toggleTask}
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

      <DragOverlay>
        {activeShift && (
          <div className="legend-item" style={{ opacity: 0.8 }}>
            <div className="legend-color" style={{ backgroundColor: activeShift.color }} />
            <div className="legend-info">
              <span className="legend-name">{activeShift.name}</span>
              <span className="legend-time">{formatShiftTimes(activeShift.times)}</span>
            </div>
          </div>
        )}
      </DragOverlay>

      {showCommentEditor && (
        <div className="task-editor-overlay" onClick={() => setShowCommentEditor(false)}>
          <div className="task-editor" onClick={e => e.stopPropagation()}>
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
    </DndContext>
  );
};

export default Calendar;