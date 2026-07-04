import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, List, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRoster } from '../context/RosterContext';
import { RosterEntry, Task } from '../types';
import { getMonthDates, formatDate, isToday, getMonthName } from '../utils/dateUtils';
import { formatShiftTimes } from '../utils/dateUtils';
import { getTaskIcon } from '../utils/iconUtils';
import { dayCommentApi } from '../data/api';
import Legend from '../components/Legend';

interface DayCommentData {
  global: string;
  employees: Record<string, string>;
}

type ViewMode = 'month' | 'list';

const PersonalRoster: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUsers } = useAuth();
  const { rosterEntries, shifts, tasks, refresh } = useRoster();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayComments, setDayComments] = useState<Record<string, DayCommentData>>({});

  React.useEffect(() => {
    refreshUsers();
    loadDayComments();
  }, []);

  React.useEffect(() => {
    const monthStart = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const monthEnd = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    refresh(monthStart, monthEnd);
  }, [currentDate]);

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

  const monthStart = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const monthEnd = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
  const sortedEntries = [...userEntries].filter(e => e.date >= monthStart && e.date <= monthEnd).sort((a, b) => a.date.localeCompare(b.date));

  const buildFootnotes = () => {
    const footnotes: Array<{ date: string; index: number; comment: string; userId?: string }> = [];
    let counter = 0;
    for (const cell of monthDates) {
      if (!cell.date) continue;
      const dateStr = formatDate(cell.date);
      const commentData = dayComments[dateStr];
      if (!commentData) continue;
      if (commentData.global) {
        counter++;
        footnotes.push({ date: dateStr, index: counter, comment: commentData.global });
      }
      if (commentData.employees) {
        const sortedUserIds = Object.keys(commentData.employees).sort();
        for (const userId of sortedUserIds) {
          const empComment = commentData.employees[userId];
          if (empComment) {
            counter++;
            footnotes.push({ date: dateStr, index: counter, comment: empComment, userId });
          }
        }
      }
    }
    return footnotes;
  };

  const footnotes = buildFootnotes();
  const cellFootnoteMap: Record<string, number[]> = {};
  for (const fn of footnotes) {
    if (!fn.userId || fn.userId === user?.id) {
      if (!cellFootnoteMap[fn.date]) {
        cellFootnoteMap[fn.date] = [];
      }
      cellFootnoteMap[fn.date].push(fn.index);
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
          <button className="btn btn-secondary" onClick={() => {
              const monthStart = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
              const monthEnd = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
              refresh(monthStart, monthEnd);
            }} title={t('refresh')}>
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
            const footnoteIndices = cellFootnoteMap[dateStr] || [];

            return (
              <div
                key={index}
                className={`month-cell ${isToday(cell.date) ? 'today' : ''} ${cell.date.getDay() == 0 || cell.date.getDay() == 6 ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
                style={shift ? { backgroundColor: shift.color + '70', border: `2px solid ${shift.color}` } : {}}
              >
                <div className="month-date">
                  {cell.date.getDate()}
                  {footnoteIndices.length > 0 && (
                    <div className="month-footnote-markers">
                      {footnoteIndices.map(idx => (
                        <sup key={idx} className="month-footnote-marker">{idx})</sup>
                      ))}
                    </div>
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
              const footnoteIndices = cellFootnoteMap[entry.date] || [];
              
              return (
                <div
                  key={entry.id}
                  className="list-entry"
                  style={shift ? { backgroundColor: shift.color + '30', border: `2px solid ${shift.color}` } : {}}
                >
                  <div className="list-date">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  {shift && (
                    <div className="list-shift-time">
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
                  {footnoteIndices.length > 0 && (
                    <div className="list-footnote-markers">
                      {footnoteIndices.map(idx => (
                        <span key={idx} className="list-footnote-marker">{idx})</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {footnotes.length > 0 && (
        <div className="roster-footnotes">
          {footnotes.map(fn => (
              <div key={`${fn.date}-${fn.userId || 'global'}`} className="footnote-item">
                <span className="footnote-number">{fn.index})</span>
                <span className="footnote-date">{new Date(fn.date + 'T00:00:00').toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' })}:</span>
                {fn.userId || (
                  <span className="footnote-user">{t('footnoteGlobalPrefix')}</span>
                )}
                <span className="footnote-text"> {fn.comment}</span>
              </div>
            ))}
        </div>
      )}

      <Legend shifts={shifts} tasks={tasks} />


    </div>

  );
};

export default PersonalRoster;
