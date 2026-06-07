export interface UserRecord {
  id: string;
  name: string;
  email: string;
  roles: ('admin' | 'employee')[];
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
  userId: string;
  date: string;
  shiftId: string | null;
  activeTaskIds: string[];
  comment?: string;
}

export interface User {
  id: string;
  email: string;
  roles: ('admin' | 'employee')[];
  name: string;
  avatar?: string;
}