export interface UserRecord {
  id: string;
  name: string;
  email: string;
  roles: ('admin' | 'employee')[];
  created_at: string;
  invite_sent?: boolean;
  display_order: number;
}

export interface ShiftTime {
  from: string;
  to: string;
}

export interface Shift {
  id: string;
  name: string;
  times: ShiftTime[];
  default_task_ids: string[];
  color: string;
  is_active: boolean;
}

export interface Task {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
}

export interface RosterEntry {
  id: string;
  user_id: string;
  date: string;
  shift_id: string | null;
  active_task_ids: string[];
  comment?: string;
}

export interface User {
  id: string;
  email: string;
  roles: ('admin' | 'employee')[];
  name: string;
}