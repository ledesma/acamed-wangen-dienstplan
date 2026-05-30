import { Employee, Shift, Task, CalendarEntry } from '../types';

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@example.com',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'emp-2',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'emp-3',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'user',
    createdAt: '2024-01-03T00:00:00Z'
  },
  {
    id: 'emp-4',
    name: 'Michael Brown',
    email: 'michael@example.com',
    role: 'user',
    createdAt: '2024-01-04T00:00:00Z'
  }
];

export const initialShifts: Shift[] = [
  {
    id: 'shift-1',
    name: 'Morning',
    times: [{ from: '08:00', to: '16:00' }],
    defaultTaskIds: ['task-1', 'task-2'],
    color: '#22c55e',
    isActive: true
  },
  {
    id: 'shift-2',
    name: 'Afternoon',
    times: [{ from: '16:00', to: '22:00' }],
    defaultTaskIds: ['task-2', 'task-3'],
    color: '#0ea5e9',
    isActive: true
  },
  {
    id: 'shift-3',
    name: 'Night',
    times: [{ from: '22:00', to: '08:00' }],
    defaultTaskIds: ['task-1'],
    color: '#8b5cf6',
    isActive: true
  },
  {
    id: 'shift-4',
    name: 'Split',
    times: [{ from: '08:00', to: '12:00' }, { from: '17:00', to: '21:00' }],
    defaultTaskIds: ['task-1', 'task-3'],
    color: '#f59e0b',
    isActive: true
  }
];

export const initialTasks: Task[] = [
  { id: 'task-1', name: 'Patient Care', icon: 'Heart', isActive: true },
  { id: 'task-2', name: 'Documentation', icon: 'FileText', isActive: true },
  { id: 'task-3', name: 'Emergency', icon: 'AlertTriangle', isActive: true },
  { id: 'task-4', name: 'Meeting', icon: 'Users', isActive: true },
  { id: 'task-5', name: 'Training', icon: 'GraduationCap', isActive: true },
  { id: 'task-6', name: 'Admin', icon: 'Clipboard', isActive: true }
];

const getDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const initialCalendarEntries: CalendarEntry[] = [
  {
    id: 'entry-1',
    employeeId: 'emp-1',
    date: getDateString(-2),
    shiftId: 'shift-1',
    activeTaskIds: ['task-1', 'task-2']
  },
  {
    id: 'entry-2',
    employeeId: 'emp-2',
    date: getDateString(-2),
    shiftId: 'shift-2',
    activeTaskIds: ['task-2', 'task-3']
  },
  {
    id: 'entry-3',
    employeeId: 'emp-1',
    date: getDateString(-1),
    shiftId: 'shift-3',
    activeTaskIds: ['task-1']
  },
  {
    id: 'entry-4',
    employeeId: 'emp-3',
    date: getDateString(-1),
    shiftId: 'shift-1',
    activeTaskIds: ['task-1', 'task-2', 'task-4']
  },
  {
    id: 'entry-5',
    employeeId: 'emp-1',
    date: getDateString(0),
    shiftId: 'shift-1',
    activeTaskIds: ['task-1', 'task-2']
  },
  {
    id: 'entry-6',
    employeeId: 'emp-2',
    date: getDateString(0),
    shiftId: 'shift-2',
    activeTaskIds: ['task-2', 'task-3']
  },
  {
    id: 'entry-7',
    employeeId: 'emp-4',
    date: getDateString(0),
    shiftId: 'shift-4',
    activeTaskIds: ['task-1', 'task-3']
  },
  {
    id: 'entry-8',
    employeeId: 'emp-1',
    date: getDateString(1),
    shiftId: 'shift-2',
    activeTaskIds: ['task-2']
  },
  {
    id: 'entry-9',
    employeeId: 'emp-3',
    date: getDateString(1),
    shiftId: 'shift-1',
    activeTaskIds: ['task-1', 'task-2', 'task-5']
  },
  {
    id: 'entry-10',
    employeeId: 'emp-2',
    date: getDateString(2),
    shiftId: 'shift-3',
    activeTaskIds: ['task-1']
  },
  {
    id: 'entry-11',
    employeeId: 'emp-4',
    date: getDateString(2),
    shiftId: 'shift-1',
    activeTaskIds: ['task-1', 'task-2']
  }
];