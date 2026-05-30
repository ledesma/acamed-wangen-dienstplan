import { getStore } from '@netlify/blobs';

const STORAGE_KEY = 'acamed_calendar_data';
const DAY_COMMENTS_KEY = 'acamed_day_comments';

interface StorageData {
  employees: any[];
  shifts: any[];
  tasks: any[];
  calendarEntries: any[];
}

interface DayComments {
  [date: string]: string;
}

let blobStore: ReturnType<typeof getStore> | null = null;

const getBlobStore = () => {
  if (!blobStore) {
    blobStore = getStore({
      name: 'acamed-calendar',
      siteID: import.meta.env.SITE_ID || 'dev'
    });
  }
  return blobStore;
};

const useBlobs = () => {
  return import.meta.env.SITE_ID !== undefined;
};

const getDayComments = async (): Promise<DayComments> => {
  try {
    if (useBlobs()) {
      const data = await getBlobStore().get(DAY_COMMENTS_KEY, { type: 'json' });
      return data || {};
    } else {
      const data = localStorage.getItem(DAY_COMMENTS_KEY);
      return data ? JSON.parse(data) : {};
    }
  } catch (e) {
    console.error('Error reading day comments:', e);
    return {};
  }
};

const setDayComments = async (comments: DayComments): Promise<void> => {
  try {
    if (useBlobs()) {
      await getBlobStore().set(DAY_COMMENTS_KEY, JSON.stringify(comments));
    } else {
      localStorage.setItem(DAY_COMMENTS_KEY, JSON.stringify(comments));
    }
  } catch (e) {
    console.error('Error writing day comments:', e);
  }
};

export const dayCommentApi = {
  async getComments() {
    return getDayComments();
  },

  async setComment(date: string, comment: string) {
    const comments = await getDayComments();
    if (comment) {
      comments[date] = comment;
    } else {
      delete comments[date];
    }
    await setDayComments(comments);
    return comments;
  }
};

const getStorageData = async (): Promise<StorageData> => {
  try {
    if (useBlobs()) {
      const data = await getBlobStore().get(STORAGE_KEY, { type: 'json' });
      if (data) return data;
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (e) {
    console.error('Error reading from storage:', e);
  }
  
  // Return default data
  const initialEmployees = [
    { id: 'emp-1', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'emp-2', name: 'John Smith', email: 'john@example.com', role: 'user', createdAt: '2024-01-02T00:00:00Z' },
    { id: 'emp-3', name: 'Emily Davis', email: 'emily@example.com', role: 'user', createdAt: '2024-01-03T00:00:00Z' },
    { id: 'emp-4', name: 'Michael Brown', email: 'michael@example.com', role: 'user', createdAt: '2024-01-04T00:00:00Z' }
  ];
  
  const today = new Date();
  const getDateString = (daysOffset: number): string => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };
  
  const initialShifts = [
    { id: 'shift-1', name: 'Morning', times: [{ from: '08:00', to: '16:00' }], defaultTaskIds: ['task-1', 'task-2'], color: '#22c55e', isActive: true },
    { id: 'shift-2', name: 'Afternoon', times: [{ from: '16:00', to: '22:00' }], defaultTaskIds: ['task-2', 'task-3'], color: '#0ea5e9', isActive: true },
    { id: 'shift-3', name: 'Night', times: [{ from: '22:00', to: '08:00' }], defaultTaskIds: ['task-1'], color: '#8b5cf6', isActive: true },
    { id: 'shift-4', name: 'Split', times: [{ from: '08:00', to: '12:00' }, { from: '17:00', to: '21:00' }], defaultTaskIds: ['task-1', 'task-3'], color: '#f59e0b', isActive: true }
  ];
  
  const initialTasks = [
    { id: 'task-1', name: 'Patient Care', icon: 'Heart', isActive: true },
    { id: 'task-2', name: 'Documentation', icon: 'FileText', isActive: true },
    { id: 'task-3', name: 'Emergency', icon: 'AlertTriangle', isActive: true },
    { id: 'task-4', name: 'Meeting', icon: 'Users', isActive: true },
    { id: 'task-5', name: 'Training', icon: 'GraduationCap', isActive: true },
    { id: 'task-6', name: 'Admin', icon: 'Clipboard', isActive: true }
  ];
  
  const initialCalendarEntries = [
    { id: 'entry-1', employeeId: 'emp-1', date: getDateString(-2), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2'] },
    { id: 'entry-2', employeeId: 'emp-2', date: getDateString(-2), shiftId: 'shift-2', activeTaskIds: ['task-2', 'task-3'] },
    { id: 'entry-3', employeeId: 'emp-1', date: getDateString(-1), shiftId: 'shift-3', activeTaskIds: ['task-1'] },
    { id: 'entry-4', employeeId: 'emp-3', date: getDateString(-1), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2', 'task-4'] },
    { id: 'entry-5', employeeId: 'emp-1', date: getDateString(0), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2'] },
    { id: 'entry-6', employeeId: 'emp-2', date: getDateString(0), shiftId: 'shift-2', activeTaskIds: ['task-2', 'task-3'] },
    { id: 'entry-7', employeeId: 'emp-4', date: getDateString(0), shiftId: 'shift-4', activeTaskIds: ['task-1', 'task-3'] },
    { id: 'entry-8', employeeId: 'emp-1', date: getDateString(1), shiftId: 'shift-2', activeTaskIds: ['task-2'] },
    { id: 'entry-9', employeeId: 'emp-3', date: getDateString(1), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2', 'task-5'] },
    { id: 'entry-10', employeeId: 'emp-2', date: getDateString(2), shiftId: 'shift-3', activeTaskIds: ['task-1'] },
    { id: 'entry-11', employeeId: 'emp-4', date: getDateString(2), shiftId: 'shift-1', activeTaskIds: ['task-1', 'task-2'] }
  ];
  
  const defaultData: StorageData = {
    employees: initialEmployees,
    shifts: initialShifts,
    tasks: initialTasks,
    calendarEntries: initialCalendarEntries
  };
  
  await setStorageData(defaultData);
  return defaultData;
};

const setStorageData = async (data: StorageData): Promise<void> => {
  try {
    if (useBlobs()) {
      await getBlobStore().set(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error writing to storage:', e);
  }
};

export const api = {
  async getEmployees() {
    const data = await getStorageData();
    return data.employees;
  },

  async createEmployee(employee: any) {
    const data = await getStorageData();
    const newEmployee = { ...employee, id: `emp-${Date.now()}`, createdAt: new Date().toISOString() };
    data.employees.push(newEmployee);
    await setStorageData(data);
    return newEmployee;
  },

  async updateEmployee(id: string, updates: any) {
    const data = await getStorageData();
    const index = data.employees.findIndex((e: any) => e.id === id);
    if (index !== -1) {
      data.employees[index] = { ...data.employees[index], ...updates };
      await setStorageData(data);
      return data.employees[index];
    }
    return null;
  },

  async deleteEmployee(id: string) {
    const data = await getStorageData();
    data.employees = data.employees.filter((e: any) => e.id !== id);
    data.calendarEntries = data.calendarEntries.filter((e: any) => e.employeeId !== id);
    await setStorageData(data);
    return true;
  },

  async getShifts() {
    const data = await getStorageData();
    return data.shifts;
  },

  async createShift(shift: any) {
    const data = await getStorageData();
    const newShift = { ...shift, id: `shift-${Date.now()}` };
    data.shifts.push(newShift);
    await setStorageData(data);
    return newShift;
  },

  async updateShift(id: string, updates: any) {
    const data = await getStorageData();
    const index = data.shifts.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      data.shifts[index] = { ...data.shifts[index], ...updates };
      await setStorageData(data);
      return data.shifts[index];
    }
    return null;
  },

  async deleteShift(id: string) {
    const data = await getStorageData();
    data.shifts = data.shifts.filter((s: any) => s.id !== id);
    data.calendarEntries = data.calendarEntries.map((e: any) => 
      e.shiftId === id ? { ...e, shiftId: null } : e
    );
    await setStorageData(data);
    return true;
  },

  async getTasks() {
    const data = await getStorageData();
    return data.tasks;
  },

  async createTask(task: any) {
    const data = await getStorageData();
    const newTask = { ...task, id: `task-${Date.now()}` };
    data.tasks.push(newTask);
    await setStorageData(data);
    return newTask;
  },

  async updateTask(id: string, updates: any) {
    const data = await getStorageData();
    const index = data.tasks.findIndex((t: any) => t.id === id);
    if (index !== -1) {
      data.tasks[index] = { ...data.tasks[index], ...updates };
      await setStorageData(data);
      return data.tasks[index];
    }
    return null;
  },

  async deleteTask(id: string) {
    const data = await getStorageData();
    data.tasks = data.tasks.filter((t: any) => t.id !== id);
    data.shifts = data.shifts.map((s: any) => ({
      ...s,
      defaultTaskIds: s.defaultTaskIds.filter((tid: string) => tid !== id)
    }));
    data.calendarEntries = data.calendarEntries.map((e: any) => ({
      ...e,
      activeTaskIds: e.activeTaskIds.filter((tid: string) => tid !== id)
    }));
    await setStorageData(data);
    return true;
  },

  async getCalendarEntries() {
    const data = await getStorageData();
    return data.calendarEntries;
  },

  async createCalendarEntry(entry: any) {
    const data = await getStorageData();
    const newEntry = { ...entry, id: `entry-${Date.now()}` };
    data.calendarEntries.push(newEntry);
    await setStorageData(data);
    return newEntry;
  },

  async updateCalendarEntry(id: string, updates: any) {
    const data = await getStorageData();
    const index = data.calendarEntries.findIndex((e: any) => e.id === id);
    if (index !== -1) {
      data.calendarEntries[index] = { ...data.calendarEntries[index], ...updates };
      await setStorageData(data);
      return data.calendarEntries[index];
    }
    return null;
  },

  async deleteCalendarEntry(id: string) {
    const data = await getStorageData();
    data.calendarEntries = data.calendarEntries.filter((e: any) => e.id !== id);
    await setStorageData(data);
    return true;
  },

  async getCalendarEntry(employeeId: string, date: string) {
    const data = await getStorageData();
    return data.calendarEntries.find(
      (e: any) => e.employeeId === employeeId && e.date === date
    );
  }
};

export default api;