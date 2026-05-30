import React, { useState, useEffect } from 'react';
import { Calendar, List, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CalendarEntry, Shift, Task } from '../types';
import api from '../data/api';
import { getMonthDates, formatDate, isToday, formatShiftTimes } from '../utils/dateUtils';
import { generateICS } from '../utils/icsUtils';

type ViewMode = 'month' | 'list';

const PersonalCalendar: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [entriesData, shiftsData, tasksData] = await Promise.all([
      api.getCalendarEntries(),
      api.getShifts(),
      api.getTasks()
    ]);
    setEntries(entriesData);
    setShifts(shiftsData);
    setTasks(tasksData);
    setLoading(false);
  };

  const userEntries = entries.filter(e => e.employeeId === user?.id);
  const monthDates = getMonthDates(currentDate);

  const getShiftForEntry = (entry: CalendarEntry) => {
    if (!entry.shiftId) return null;
    return shifts.find(s => s.id === entry.shiftId);
  };

  const getTasksForEntry = (entry: CalendarEntry) => {
    return entry.activeTaskIds
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean) as Task[];
  };

  const sortedEntries = [...userEntries].sort((a, b) => a.date.localeCompare(b.date));

  const handleDownloadICS = () => {
    const userEntriesWithDetails = userEntries.map(entry => {
      const shift = getShiftForEntry(entry);
      const entryTasks = getTasksForEntry(entry);
      return {
        date: entry.date,
        shiftName: shift?.name || 'No Shift',
        shiftTimes: shift ? formatShiftTimes(shift.times) : '',
        tasks: entryTasks.map(t => t.name).join(', ')
      };
    });
    
    const icsContent = generateICS(user?.name || 'User', userEntriesWithDetails);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getTaskIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      Heart: '♥',
      FileText: '📄',
      AlertTriangle: '⚠',
      Users: '👥',
      GraduationCap: '🎓',
      Clipboard: '📋'
    };
    return icons[iconName] || '•';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="personal-calendar">
      <div className="personal-header">
        <div className="calendar-nav">
          <button className="btn btn-secondary" onClick={() => navigateMonth(-1)}>
            <Calendar size={18} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <span className="calendar-title">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary" onClick={() => navigateMonth(1)}>
            <Calendar size={18} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              <Calendar size={16} />
              Month
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
              List
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleDownloadICS}>
            <Download size={16} />
            Export ICS
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="month-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="month-header">{day}</div>
          ))}
          
          {monthDates.map((date, index) => {
            if (!date) return <div key={index} className="month-cell" />;
            
            const dateStr = formatDate(date);
            const dayEntries = userEntries.filter(e => e.date === dateStr);
            
            return (
              <div
                key={index}
                className={`month-cell ${isToday(date) ? 'today' : ''}`}
              >
                <div className="month-date">{date.getDate()}</div>
                <div className="month-entries">
                  {dayEntries.map(entry => {
                    const shift = getShiftForEntry(entry);
                    return shift ? (
                      <div
                        key={entry.id}
                        className="month-entry"
                        style={{ backgroundColor: shift.color }}
                      >
                        <span>{shift.name}</span>
                        {entry.activeTaskIds.slice(0, 2).map(taskId => {
                          const task = tasks.find(t => t.id === taskId);
                          return task ? (
                            <span key={taskId} style={{ fontSize: '0.65rem' }}>
                              {getTaskIcon(task.icon)}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="list-view">
          {sortedEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No scheduled shifts</div>
              <p>Your calendar is empty</p>
            </div>
          ) : (
            sortedEntries.map(entry => {
              const shift = getShiftForEntry(entry);
              const entryTasks = getTasksForEntry(entry);
              
              return (
                <div key={entry.id} className="list-entry">
                  <div className="list-date">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  {shift && (
                    <div className="list-shift">
                      <div
                        className="card-color"
                        style={{ backgroundColor: shift.color, width: 12, height: 12 }}
                      />
                      <span>{shift.name}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                        {formatShiftTimes(shift.times)}
                      </span>
                    </div>
                  )}
                  <div className="list-tasks">
                    {entryTasks.map(task => (
                      <div
                        key={task.id}
                        className="task-icon"
                        title={task.name}
                      >
                        {getTaskIcon(task.icon)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalCalendar;