import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, List, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RosterEntry, Shift, Task } from '../types';
import api from '../data/api';
import { getMonthDates, formatDate, isToday, formatShiftTimes, getMonthName } from '../utils/dateUtils';
import { generateICS } from '../utils/icsUtils';
import { getTaskIcon } from '../utils/iconUtils';

type ViewMode = 'month' | 'list';

const PersonalRoster: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshEmployees } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshEmployees();
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [entriesData, shiftsData, tasksData] = await Promise.all([
      api.getRosterEntries(),
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

  const getShiftForEntry = (entry: RosterEntry) => {
    if (!entry.shiftId) return null;
    return shifts.find(s => s.id === entry.shiftId);
  };

  const getTasksForEntry = (entry: RosterEntry) => {
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
    a.download = 'roster.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="personal-roster">
      <div className="personal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary" onClick={loadData} title={t('refresh')}>
            <RefreshCw size={18} />
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
              title={t('month')}
            >
              <Calendar size={16} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title={t('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="roster-nav">
          <button className="btn btn-secondary" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="roster-title">
            {getMonthName(currentDate)} {currentDate.getFullYear().toString()}
          </span>
          <button className="btn btn-secondary" onClick={() => navigateMonth(1)}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>
            {t('today')}
          </button>
          <button className="btn btn-primary" onClick={handleDownloadICS} title={t('exportICS')}>
            <Download size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="month-grid">
          {[1,2,3,4,5,6,0].map(day => (
            <div key={`header_${day}`} className="month-header">{t(`days_short.${day}`)}</div>
          ))}
          
          {monthDates.map((cell, index) => {
            if (!cell.date) {
              return <div key={index} className={`month-cell ${cell.isEmpty ? 'empty' : ''}`} />;
            }
            
            const dateStr = formatDate(cell.date);
            const dayEntries = userEntries.filter(e => e.date === dateStr);
            
            return (
              <div
                key={index}
                className={`month-cell ${isToday(cell.date) ? 'today' : ''} ${cell.date.getDay() == 0 || cell.date.getDay() == 6 ? 'weekend' : ''}`}
              >
                <div className="month-date">{cell.date.getDate()}</div>
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
                                <span className="material-symbols-rounded">{getTaskIcon(task.icon)}</span>
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
              <div className="empty-title">{t('noScheduledShifts')}</div>
              <p>{t('yourRosterIsEmpty')}</p>
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
                        <span className="material-symbols-rounded">{getTaskIcon(task.icon)}</span>
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

export default PersonalRoster;