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
  refresh: () => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const refresh = async () => {
    const [entriesData, shiftsData, tasksData] = await Promise.all([
      api.getRosterEntries(),
      api.getShifts(),
      api.getTasks()
    ]);
    setRosterEntries(entriesData);
    setShifts(shiftsData);
    setTasks(tasksData);
  };

  useEffect(() => {
    refresh();
  }, []);

  const exportICS = (user: { name: string; id: string }) => {
    const userEntries = rosterEntries.filter(e => e.employeeId === user.id);
    const userEntriesWithDetails = userEntries.map(entry => {
      const shift = shifts.find(s => s.id === entry.shiftId);
      const entryTasks = entry.activeTaskIds
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
