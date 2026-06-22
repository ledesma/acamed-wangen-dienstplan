import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RosterEntry, Shift, Task } from '../types';
import api from '../data/api';
import { formatShiftTimes } from '../utils/dateUtils';
import { generateICS } from '../utils/icsUtils';

interface RosterContextType {
  rosterEntries: RosterEntry[];
  shifts: Shift[];
  tasks: Task[];
  exportICS: (user: { name: string; id: string }) => void;
  refresh: (from?: string, to?: string) => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const refresh = async (from?: string, to?: string) => {
    const [entriesData, shiftsData, tasksData] = await Promise.all([
      api.getRosterEntries(from, to),
      api.getShifts(),
      api.getTasks()
    ]);
    setRosterEntries(entriesData);
    setShifts(shiftsData);
    setTasks(tasksData);
  };

  useEffect(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    refresh(
      `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}`,
      `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`
    );
  }, []);

  const exportICS = (user: { name: string; id: string }) => {
    const userEntries = rosterEntries.filter(e => e.user_id === user.id);
    const userEntriesWithDetails = userEntries.map(entry => {
      const shift = shifts.find(s => s.id === entry.shift_id);
      const entryTasks = entry.active_task_ids
        .map(id => tasks.find(t => t.id === id))
        .filter(Boolean) as Task[];
      return {
        date: entry.date,
        shiftName: shift?.name || 'No Shift',
        shiftTimes: shift ? formatShiftTimes(shift.times) : '',
        tasks: entryTasks.map(t => t.name).join(', ')
      };
    });
    
    const icsContent = generateICS(user.name, userEntriesWithDetails);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RosterContext.Provider
      value={{
        rosterEntries,
        shifts,
        tasks,
        exportICS,
        refresh
      }}
    >
      {children}
    </RosterContext.Provider>
  );
};

export const useRoster = () => {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
};
