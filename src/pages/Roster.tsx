import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Shift, Task, RosterEntry } from '../types';
import api, { dayCommentApi } from '../data/api';
import { getWeekDates, formatDate, isToday, getDayName, getMonthName } from '../utils/dateUtils';
import { getTaskIcon } from '../utils/iconUtils';
import Legend from '../components/Legend';

interface DayCommentData {
  global: string;
  employees: Record<string, string>;
}

const DroppableCell: React.FC<{
  userId: string;
  userName: string;
  date: string;
  entry: RosterEntry | undefined;
  shift: Shift | undefined;
  tasks: Task[];
  isAdmin: boolean;
  isWeekend: boolean;
  employeeComment: string;
  footnoteIndices: number[];
  onSaveTasks: (userId: string, date: string, taskIds: string[]) => void;
  onShiftDrop: (userId: string, date: string, shiftId: string) => void;
  onClearCell: (userId: string, date: string) => void;
  onCommentSave: (userId: string, date: string, comment: string) => void;
  onCommentClear: (userId: string, date: string) => void;
  onEditComment: (userId: string, date: string) => void;
}> = ({ userId, userName, date, entry, shift, tasks, isAdmin, isWeekend, employeeComment, footnoteIndices, onSaveTasks, onShiftDrop, onClearCell, onCommentSave, onCommentClear, onEditComment }) => {
  const { t } = useTranslation();
  const [isOver, setIsOver] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');

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
    if (isAdmin) {
      if (entry?.shift_id) {
        setSelectedTaskIds([...activeTasks]);
        setShowTaskEditor(true);
      } else {
        onEditComment(userId, date);
      }
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSaveTasks = () => {
    onSaveTasks(userId, date, selectedTaskIds);
    onCommentSave(userId, date, commentText);
    setShowTaskEditor(false);
  };

  const handleClearCell = () => {
    onClearCell(userId, date);
    setShowTaskEditor(false);
  };

  const handleClearComment = () => {
    onCommentClear(userId, date);
    setCommentText('');
  };

  const hasEntry = !!entry;

  return (
    <>
      <div
        className={`day-cell ${isOver ? 'drag-over' : ''} ${isWeekend ? 'weekend' : ''} ${shift ? 'has-shift' : ''}`}
        style={shift ? { backgroundColor: shift.color + '70', border: `2px solid ${shift.color}` } : {}}
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
            {footnoteIndices.map(idx => (
              <sup key={idx} className="footnote-marker">{idx})</sup>
            ))}
          </div>
        )}
        {!shift && footnoteIndices.length > 0 && (
          <div className="footnote-marker">{footnoteIndices.map(idx => (
              <span key={idx}>{idx})</span>
            ))}</div>
        )}
      </div>
      
      {showTaskEditor && isAdmin && (
        <div className="task-editor-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowTaskEditor(false);
          }
        }}>
          <div className="task-editor">
            <h3>{t('editCell')} - {userName} / {date}</h3>
            
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

            <hr className="task-editor-divider" />

            <div className="form-group">
              <label className="label">{t('comment')}</label>
              <input
                type="text"
                className="input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('addComment')}
              />
            </div>

            <div className="task-editor-actions task-editor-actions-right">
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setShowTaskEditor(false)}>
                  {t('close')}
                </button>
                <button className="btn btn-primary" onClick={handleSaveTasks}>
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
                {employeeComment && (
                  <button className="btn btn-secondary" onClick={handleClearComment}>
                    {t('clear')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DayHeader: React.FC<{ date: Date; isAdmin: boolean; footnoteIndices: number[]; onCommentClick: () => void }> = ({ 
  date, 
  isAdmin, 
  footnoteIndices,
  onCommentClick
}) => {
  return (
    <div className={`week-header-cell ${isToday(date) ? 'today' : ''} ${isAdmin ? 'clickable' : ''}`} onClick={isAdmin ? onCommentClick : undefined}>
      <div className="header-top">
        <span className="title">{getDayName(date, true)}, {date.getDate()}</span>
        {footnoteIndices.map(idx => (
          <span key={idx} className="footnote-marker">{idx})</span>
        ))}
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
  const [dayComments, setDayComments] = useState<Record<string, DayCommentData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentEditor, setShowCommentEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [commentText, setCommentText] = useState('');

  const shiftsRef = useRef(shifts);
  const entriesRef = useRef(entries);
  shiftsRef.current = shifts;
  entriesRef.current = entries;

  const weekDates = getWeekDates(currentWeekStart);
  const rosterUsers = users.filter(u => u.roles?.includes('employee'));

  const buildFootnotes = () => {
    const footnotes: Array<{ date: string; index: number; comment: string; userId?: string }> = [];
    let counter = 0;
    for (const date of weekDates) {
      const dateStr = formatDate(date);
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
  const headerFootnoteMap: Record<string, number[]> = {};
  const cellFootnoteMap: Record<string, number[]> = {};
  const dayHasEmployeeComment = new Set<string>();
  for (const fn of footnotes) {
    if (!fn.userId) {
      if (!headerFootnoteMap[fn.date]) {
        headerFootnoteMap[fn.date] = [];
      }
      headerFootnoteMap[fn.date].push(fn.index);
    } else {
      const key = `${fn.userId}-${fn.date}`;
      if (!cellFootnoteMap[key]) {
        cellFootnoteMap[key] = [];
      }
      cellFootnoteMap[key].push(fn.index);
      dayHasEmployeeComment.add(fn.date);
    }
  }

  useEffect(() => {
    refreshUsers();
    loadData(weekDates[0], weekDates[weekDates.length - 1]);
  }, []);

  useEffect(() => {
    loadData(weekDates[0], weekDates[weekDates.length - 1]);
  }, [currentWeekStart]);

  const loadData = async (weekStart: Date, weekEnd: Date) => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsData, tasksData, entriesData, commentsData] = await Promise.all([
        api.getShifts(),
        api.getTasks(),
        api.getRosterEntries(formatDate(weekStart), formatDate(weekEnd)),
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

  const openCommentEditor = (date: string, userId?: string) => {
    setSelectedDate(date);
    setSelectedUserId(userId);
    const commentData = dayComments[date];
    if (userId && commentData?.employees) {
      setCommentText(commentData.employees[userId] || '');
    } else if (!userId && commentData?.global) {
      setCommentText(commentData.global || '');
    } else {
      setCommentText('');
    }
    setShowCommentEditor(true);
  };

  const saveComment = async () => {
    await dayCommentApi.setComment(selectedDate, commentText, selectedUserId);
    setDayComments(prev => {
      const next = { ...prev, [selectedDate]: {
        global: selectedUserId ? (prev[selectedDate]?.global || '') : commentText,
        employees: selectedUserId ? {
          ...(prev[selectedDate]?.employees || {}),
          [selectedUserId]: commentText
        } : (prev[selectedDate]?.employees || {})
      }};
      return next;
    });
    setShowCommentEditor(false);
  };

  const clearComment = async () => {
    await dayCommentApi.deleteComment(selectedDate, selectedUserId);
    setDayComments(prev => {
      const next = { ...prev };
      if (selectedUserId) {
        const empComments = { ...(next[selectedDate]?.employees || {}) };
        delete empComments[selectedUserId];
        next[selectedDate] = {
          global: next[selectedDate]?.global || '',
          employees: empComments
        };
      } else {
        next[selectedDate] = {
          global: '',
          employees: next[selectedDate]?.employees || {}
        };
      }
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

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || userId;
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
        <button className="btn btn-secondary" onClick={() => loadData(weekDates[0], weekDates[weekDates.length - 1])} style={{ marginTop: 16 }}>
          <RefreshCw size={18} /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="roster-container">
        <div className="roster-header">
          <button className="btn btn-secondary" onClick={() => loadData(weekDates[0], weekDates[weekDates.length - 1])} title={t('refresh')}>
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
          {weekDates.map(date => {
            const dateStr = formatDate(date);
            return (
              <DayHeader 
                key={date.toISOString()} 
                date={date} 
                isAdmin={isAdmin}
                footnoteIndices={headerFootnoteMap[dateStr] || []}
                onCommentClick={() => openCommentEditor(dateStr)}
              />
            );
          })}

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
                const commentData = dayComments[dateStr];
                const employeeComment = commentData?.employees?.[user.id] || '';
                const cellKey = `${user.id}-${dateStr}`;
                const footnoteIndices = cellFootnoteMap[cellKey] || [];
                
                return (
                  <DroppableCell
                    key={cellKey}
                    userId={user.id}
                    userName={user.name}
                    date={dateStr}
                    entry={entry}
                    shift={shift}
                    tasks={tasks}
                    isAdmin={isAdmin}
                    isWeekend={isWeekend}
                    employeeComment={employeeComment}
                    footnoteIndices={footnoteIndices}
                    onSaveTasks={saveTasks}
                    onShiftDrop={handleShiftDrop}
                    onClearCell={clearCell}
                    onEditComment={(userId, date) => openCommentEditor(date, userId)}
                    onCommentSave={(userId, date, comment) => {
                      if (comment.trim()) {
                        dayCommentApi.setComment(date, comment, userId);
                        setDayComments(prev => ({
                          ...prev,
                          [date]: {
                            global: prev[date]?.global || '',
                            employees: {
                              ...(prev[date]?.employees || {}),
                              [userId]: comment
                            }
                          }
                        }));
                      }
                    }}
                    onCommentClear={(userId, date) => {
                      dayCommentApi.deleteComment(date, userId);
                      setDayComments(prev => {
                        const empComments = { ...(prev[date]?.employees || {}) };
                        delete empComments[userId];
                        return {
                          ...prev,
                          [date]: {
                            global: prev[date]?.global || '',
                            employees: empComments
                          }
                        };
                      });
                    }}
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

        {footnotes.length > 0 && (
          <div className="roster-footnotes">
            {footnotes.map(fn => {
              const user = fn.userId ? users.find(u => u.id === fn.userId) : null;
              return (
                <div key={`${fn.date}-${fn.userId || 'global'}`} className="footnote-item">
                  <span className="footnote-number">{fn.index})</span>
                  <span className="footnote-date">{getDayName(new Date(fn.date + 'T00:00:00'), true)}, {new Date(fn.date + 'T00:00:00').getDate()}.{(new Date(fn.date + 'T00:00:00').getMonth() + 1).toString().padStart(2, '0')}.{new Date(fn.date + 'T00:00:00').getFullYear()}:</span>
                  {user && (
                    <span className="footnote-user">{user.name}</span>
                  )}
                  <span className="footnote-text"> {fn.comment}</span>
                </div>
              );
            })}
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
            <h3>
              {selectedUserId 
                ? `${t('editCell')} - ${getUserName(selectedUserId)} / ${selectedDate}`
                : `Day Comment - ${selectedDate}`
              }
            </h3>
            
            <div className="form-group">
              <label className="label">{t('comment')}</label>
              <input
                type="text"
                className="input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('addComment')}
              />
            </div>
            
            <div className="task-editor-actions">
               <button className="btn btn-danger" onClick={clearComment}>
                 {t('clear')}
               </button>
              <button className="btn btn-primary" onClick={saveComment}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Roster;
