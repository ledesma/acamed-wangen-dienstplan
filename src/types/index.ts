export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  inviteSent?: boolean;
}

export interface ShiftTime {
  from: string;
  to: string;
}

export interface Shift {
  id: string;
  name: string;
  times: ShiftTime[];
  defaultTaskIds: string[];
  color: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface RosterEntry {
  id: string;
  employeeId: string;
  date: string;
  shiftId: string | null;
  activeTaskIds: string[];
  comment?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
  avatar?: string;
}