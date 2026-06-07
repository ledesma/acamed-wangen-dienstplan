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

const getBlobsStore = async (storeName: string) => {
  const { getStore } = await import('@netlify/blobs');
  return getStore({name: storeName});
};

export const getStorageData = async (): Promise<StorageData> => {
  const store = await getBlobsStore(BLOB_STORE_NAME);
  const data = await store.get(STORAGE_KEY, { type: 'json' });
  if (data) return data;
  throw new Error('No data found in storage. Please upload seed-data.json to the blob store.');
};

export const setStorageData = async (data: StorageData): Promise<void> => {
  const store = await getBlobsStore(BLOB_STORE_NAME);
  await store.set(STORAGE_KEY, JSON.stringify(data));
};

export const getDayComments = async (): Promise<DayComments> => {
  const store = await getBlobsStore(BLOB_STORE_NAME);
  const data = await store.get(DAY_COMMENTS_KEY, { type: 'json' });
  return data || {};
};

export const setDayComments = async (comments: DayComments): Promise<void> => {
  const store = await getBlobsStore(BLOB_STORE_NAME);
  await store.set(DAY_COMMENTS_KEY, JSON.stringify(comments));
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
