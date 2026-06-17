import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, List, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRoster } from '../context/RosterContext';
import { RosterEntry, Task } from '../types';
import { getMonthDates, formatDate, isToday, getMonthName } from '../utils/dateUtils';
import { formatShiftTimes } from '../utils/dateUtils';
import { getTaskIcon } from '../utils/iconUtils';
import { dayCommentApi } from '../data/api';
import Legend from '../components/Legend';

type ViewMode = 'month' | 'list';

const PersonalRoster: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUsers } = useAuth();
  const { rosterEntries, shifts, tasks, refresh } = useRoster();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayComments, setDayComments] = useState<Record<string, string>>({});

  React.useEffect(() => {
    refreshUsers();
    loadDayComments();
  }, []);

  const loadDayComments = async () => {
    try {
      const comments = await dayCommentApi.getComments();
      setDayComments(comments || {});
    } catch {
      // ignore errors
    }
  };

  const userEntries = rosterEntries.filter(e => e.user_id === user?.id);
  const monthDates = getMonthDates(currentDate);

  const getShiftForEntry = (entry: RosterEntry | undefined) => {
    if (!entry?.shift_id) return null;
    return shifts.find(s => s.id === entry.shift_id);
  };

  const getTasksForEntry = (entry: RosterEntry) => {
    return entry.active_task_ids
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean) as Task[];
  };

  const sortedEntries = [...userEntries].sort((a, b) => a.date.localeCompare(b.date));

  const footnoteMap: Record<string, number> = {};
  let footnoteCounter = 0;
  for (const cell of monthDates) {
    if (!cell.date) continue;
    const dateStr = formatDate(cell.date);
    if (dayComments[dateStr]) {
      footnoteCounter++;
      footnoteMap[dateStr] = footnoteCounter;
    }
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEntryForDate = (dateStr: string) => {
    return userEntries.find(e => e.date === dateStr);
  };

  return (
    <div className="personal-roster">
      <div className="personal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary" onClick={refresh} title={t('refresh')}>
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

        <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>
          {t('today')}
        </button>
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
            const entry = getEntryForDate(dateStr);
            const shift = getShiftForEntry(entry);
            const entryTasks = entry ? getTasksForEntry(entry) : [];
            const hasComment = !!dayComments[dateStr];

            return (
              <div
                key={index}
                className={`month-cell ${isToday(cell.date) ? 'today' : ''} ${cell.date.getDay() == 0 || cell.date.getDay() == 6 ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
                style={shift ? { backgroundColor: shift.color + '30', border: `2px solid ${shift.color}` } : {}}
              >
                <div className="month-date">
                  {cell.date.getDate()}
                  {footnoteMap[dateStr] !== undefined && (
                    <sup className="month-footnote-marker">{footnoteMap[dateStr]})</sup>
                  )}

                </div>
                {shift && (
                  <div className="month-cell-content">
                    {entryTasks.length > 0 && (
                      <div className="task-icons">
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
                    )}
                  </div>
                )}
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
                  {footnoteMap[entry.date] !== undefined && (
                    <span className="list-footnote-marker">{footnoteMap[entry.date]})</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {Object.keys(footnoteMap).length > 0 && (
        <div className="roster-footnotes">
          {Object.entries(footnoteMap).map(([dateStr, index]) => (
            <div key={dateStr} className="footnote-item">
              <span className="footnote-number">{index})</span>
              <span className="footnote-date">{new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' })}:</span>
              <span className="footnote-text">{dayComments[dateStr]}</span>
            </div>
          ))}
        </div>
      )}

      <Legend shifts={shifts} tasks={tasks} />


    </div>

  );
};

export default PersonalRoster;
