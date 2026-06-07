export const initialUsers = [
  { id: 'user-1', name: 'Caro', email: 'caro@ledesma.ch', roles: ['admin', 'employee'], createdAt: '2024-01-01T00:00:00Z' },
  { id: 'user-2', name: 'Javier', email: 'javier@ledesma.ch', roles: ['admin'], createdAt: '2024-01-02T00:00:00Z' },
  { id: 'user-3', name: 'Emily Davis', email: 'emily@example.com', roles: ['employee'], createdAt: '2024-01-03T00:00:00Z' },
  { id: 'user-4', name: 'Michael Brown', email: 'michael@example.com', roles: [], createdAt: '2024-01-04T00:00:00Z' }
];

const today = new Date();
const getDateString = (daysOffset: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const initialShifts = [
  { id: 'shift-1', name: 'Morning', times: [{ from: '08:00', to: '16:00' }], defaultTaskIds: ['task-1', 'task-2'], color: '#22c55e', isActive: true },
  { id: 'shift-2', name: 'Afternoon', times: [{ from: '16:00', to: '22:00' }], defaultTaskIds: ['task-2', 'task-3'], color: '#0ea5e9', isActive: true },
  { id: 'shift-3', name: 'Night', times: [{ from: '22:00', to: '08:00' }], defaultTaskIds: ['task-1'], color: '#8b5cf6', isActive: true },
  { id: 'shift-4', name: 'Split', times: [{ from: '08:00', to: '12:00' }, { from: '17:00', to: '21:00' }], defaultTaskIds: ['task-1', 'task-3'], color: '#f59e0b', isActive: true }
];

export const initialTasks = [
  { id: 'task-1', name: 'Patient Care', icon: 'Heart', isActive: true },
  { id: 'task-2', name: 'Documentation', icon: 'FileText', isActive: true },
  { id: 'task-3', name: 'Emergency', icon: 'AlertTriangle', isActive: true },
  { id: 'task-4', name: 'Meeting', icon: 'Users', isActive: true },
  { id: 'task-5', name: 'Training', icon: 'GraduationCap', isActive: true },
  { id: 'task-6', name: 'Admin', icon: 'Clipboard', isActive: true }
];

export const initialRosterEntries = [
  { id: 'entry-1', userId: 'user-1', date: getDateString(-2), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2'] },
  { id: 'entry-3', userId: 'user-1', date: getDateString(-1), shiftId: 'shift-3', activeTaskIds: ['task-1'] },
  { id: 'entry-4', userId: 'user-3', date: getDateString(-1), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2', 'task-4'] },
  { id: 'entry-5', userId: 'user-1', date: getDateString(0), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2'] },
  { id: 'entry-8', userId: 'user-1', date: getDateString(1), shiftId: 'shift-2', activeTaskIds: ['task-2'] },
  { id: 'entry-9', userId: 'user-3', date: getDateString(1), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2', 'task-5'] },
];
