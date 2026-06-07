import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getUser } from '@netlify/identity';

const STORAGE_KEY = 'acamed_roster_data';
const DAY_COMMENTS_KEY = 'acamed_day_comments';
const BLOB_STORE_NAME = 'acamed-roster';

interface StorageData {
  users: any[];
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

export const getStorageData = async (): Promise<StorageData> => {
  if (isNetlifyEnv()) {
    try {
      const store = await getBlobsStore(BLOB_STORE_NAME);
      const data = await store.get(STORAGE_KEY, { type: 'json' });
      if (data) return data;
    } catch (e) {
      console.warn('Error reading from blobs:', e);
    }
    throw new Error('No data found in storage. Please upload seed-data.json to the blob store.');
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
  
  throw new Error('No data found in storage. Please upload seed-data.json to the local storage path.');
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
  if (!user || !user.roles?.includes('admin')) {
    throw new Error('Forbidden: Admin access required');
  }
};

export const getUserFromRequest = async (req: Request): Promise<any> => {
  try {
    const user = await getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || []
    };
  } catch (e) {
    console.error('[shared] Error in getUserFromRequest:', e);
    return null;
  }
};
