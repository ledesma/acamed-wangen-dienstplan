import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const STORAGE_KEY = 'acamed_roster_data';
const DAY_COMMENTS_KEY = 'acamed_day_comments';
const BLOB_STORE_NAME = 'acamed-roster';

interface StorageData {
  employees: any[];
  shifts: any[];
  tasks: any[];
  rosterEntries: any[];
}

interface DayComments {
  [date: string]: string;
}

const isNetlifyEnv = (): boolean => {
  return typeof process !== 'undefined' && !!process.env.SITE_ID;
};

const getBlobsStore = async (storeName: string) => {
  const { getStore } = await import('@netlify/blobs');
  return getStore({name: storeName});
};

const getBlobsDir = (): string => {
  const cwd = typeof process !== 'undefined' ? process.cwd() : '/tmp';
  return join(cwd, '.netlify', 'blobs-serve', BLOB_STORE_NAME);
};

const getStoragePath = (): string => {
  const dir = getBlobsDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, STORAGE_KEY);
};

const getBackupPath = (): string => {
  return getStoragePath() + '.backup';
};

const saveBackup = (data: StorageData): void => {
  try {
    writeFileSync(getBackupPath(), JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving backup:', e);
  }
};

const restoreFromBackup = (): StorageData | null => {
  const backupPath = getBackupPath();
  if (existsSync(backupPath)) {
    try {
      return JSON.parse(readFileSync(backupPath, 'utf-8'));
    } catch (e) {
      console.warn('Error restoring from backup:', e);
    }
  }
  return null;
};

const getCommentsPath = (): string => {
  const dir = getBlobsDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, DAY_COMMENTS_KEY);
};

const getDefaultData = (): StorageData => {
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
  
  const initialRosterEntries = [
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
  
  return {
    employees: initialEmployees,
    shifts: initialShifts,
    tasks: initialTasks,
    rosterEntries: initialRosterEntries
  };
};

export const getStorageData = async (): Promise<StorageData> => {
  if (isNetlifyEnv()) {
    try {
      const store = await getBlobsStore(BLOB_STORE_NAME);
      const data = await store.get(STORAGE_KEY, { type: 'json' });
      if (data) return data;
    } catch (e) {
      console.warn('Error reading from blobs:', e);
    }
    return getDefaultData();
  }
  
  const storagePath = getStoragePath();
  if (existsSync(storagePath)) {
    try {
      return JSON.parse(readFileSync(storagePath, 'utf-8'));
    } catch {
      console.warn('Main storage corrupted, trying backup...');
      const backup = restoreFromBackup();
      if (backup) return backup;
    }
  }
  
  const backup = restoreFromBackup();
  if (backup) return backup;
  
  return getDefaultData();
};

export const setStorageData = async (data: StorageData): Promise<void> => {
  if (isNetlifyEnv()) {
    try {
      const store = await getBlobsStore(BLOB_STORE_NAME);
      await store.set(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Error writing to blobs:', e);
    }
  } else {
    const storagePath = getStoragePath();
    
    if (existsSync(storagePath)) {
      try {
        const existingData = JSON.parse(readFileSync(storagePath, 'utf-8'));
        saveBackup(existingData);
      } catch {}
    }
    
    writeFileSync(storagePath, JSON.stringify(data));
  }
};

export const getDayComments = async (): Promise<DayComments> => {
  if (isNetlifyEnv()) {
    try {
      const store = await getBlobsStore(BLOB_STORE_NAME);
      const data = await store.get(DAY_COMMENTS_KEY, { type: 'json' });
      if (data) return data;
    } catch (e) {
      console.warn('Error reading from blobs:', e);
    }
    return {};
  }
  
  const commentsPath = getCommentsPath();
  if (existsSync(commentsPath)) {
    try {
      return JSON.parse(readFileSync(commentsPath, 'utf-8'));
    } catch {}
  }
  
  return {};
};

export const setDayComments = async (comments: DayComments): Promise<void> => {
  if (isNetlifyEnv()) {
    try {
      const store = await getBlobsStore(BLOB_STORE_NAME);
      await store.set(DAY_COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
      console.warn('Error writing to blobs:', e);
    }
  } else {
    const commentsPath = getCommentsPath();
    writeFileSync(commentsPath, JSON.stringify(comments));
  }
};

export const requireAdmin = (user: any): void => {
  if (!user || user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
};

export const getUserFromHeader = async (authHeader: string | undefined): Promise<any> => {
  if (!authHeader) return null;
  try {
    const base64 = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    if (!email || !password) return null;
    
    const data = await getStorageData();
    const employee = data.employees.find((e: any) => e.email === email);
    
    if (!employee) return null;
    
    return employee;
  } catch (e) {
    console.error('[shared] Error in getUserFromHeader:', e);
    return null;
  }
};