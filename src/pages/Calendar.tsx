import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { useAuth } from '../context/AuthContext';
import { Shift, Task, CalendarEntry } from '../types';
import api from '../data/api';
import { getWeekDates, formatDate, isToday, getDayName, formatShiftTimes } from '../utils/dateUtils';

const DraggableLegendItem: React.FC<{ shift: Shift }> = ({ shift }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `legend-${shift.id}`,
    data: { shift }
  });

  return (
    <div
      ref={setNodeRef}
      className={`legend-item ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
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
  onRemove: (employeeId: string, date: string) => void;
  onToggleTask: (employeeId: string, date: string, taskId: string) => void;
}> = ({ employeeId, date, entry, shift, tasks, isAdmin, onRemove, onToggleTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${employeeId}-${date}`,
    data: { employeeId, date }
  });

  const activeTasks = entry?.activeTaskIds || [];
  
  const handleClick = () => {
    if (isAdmin && entry?.shiftId) {
      onRemove(employeeId, date);
    }
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAdmin) onToggleTask(employeeId, date, taskId);
                  }}
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
  );
};

const Calendar: React.FC = () => {
  console.log('Calendar component rendering!');
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
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading calendar data...');
    setLoading(true);
    const [shiftsData, tasksData, entriesData] = await Promise.all([
      api.getShifts(),
      api.getTasks(),
      api.getCalendarEntries()
    ]);
    console.log('Shifts:', shiftsData);
    console.log('Tasks:', tasksData);
    console.log('Entries:', entriesData);
    console.log('Employees:', employees);
    setShifts(shiftsData);
    setTasks(tasksData);
    setEntries(entriesData);
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

    if (shiftData && cellData) {
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
            <div
              key={date.toISOString()}
              className={`week-header-cell ${isToday(date) ? 'today' : ''}`}
            >
              <div>{getDayName(date, true)}</div>
              <div className="week-header-date">{date.getDate()}</div>
            </div>
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
                    onRemove={removeShift}
                    onToggleTask={toggleTask}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="legend">
          {shifts.filter(s => s.isActive).map(shift => (
            <DraggableLegendItem key={shift.id} shift={shift} />
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
    </DndContext>
  );
};

export default Calendar;