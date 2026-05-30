const API_BASE = '/.netlify/functions';

let cachedCredentials: { email: string; password: string } | null = null;

const loadCachedCredentials = () => {
  if (cachedCredentials) return;
  try {
    const stored = sessionStorage.getItem('acamed_creds');
    if (stored) {
      cachedCredentials = JSON.parse(stored);
    }
  } catch {}
};

const saveCredentials = (email: string, password: string) => {
  cachedCredentials = { email, password };
  sessionStorage.setItem('acamed_creds', JSON.stringify({ email, password }));
};

export const setCredentials = (email: string, password: string) => {
  saveCredentials(email, password);
};

export const clearCredentials = () => {
  cachedCredentials = null;
  sessionStorage.removeItem('acamed_creds');
};

export const getAuthHeader = (): string | null => {
  loadCachedCredentials();
  if (cachedCredentials) {
    const credentials = btoa(`${cachedCredentials.email}:${cachedCredentials.password}`);
    return `Basic ${credentials}`;
  }
  return null;
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  
  const authHeader = getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const api = {
  async getEmployees() {
    return apiFetch('/employees', { method: 'GET' });
  },

  async createEmployee(employee: any) {
    return apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  },

  async updateEmployee(id: string, updates: any) {
    return apiFetch('/employees', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteEmployee(id: string) {
    return apiFetch(`/employees?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getShifts() {
    return apiFetch('/shifts', { method: 'GET' });
  },

  async createShift(shift: any) {
    return apiFetch('/shifts', {
      method: 'POST',
      body: JSON.stringify(shift)
    });
  },

  async updateShift(id: string, updates: any) {
    return apiFetch('/shifts', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteShift(id: string) {
    return apiFetch(`/shifts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getTasks() {
    return apiFetch('/tasks', { method: 'GET' });
  },

  async createTask(task: any) {
    return apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  },

  async updateTask(id: string, updates: any) {
    return apiFetch('/tasks', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteTask(id: string) {
    return apiFetch(`/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getCalendarEntries() {
    return apiFetch('/calendar-entries', { method: 'GET' });
  },

  async createCalendarEntry(entry: any) {
    return apiFetch('/calendar-entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  async updateCalendarEntry(id: string, updates: any) {
    return apiFetch('/calendar-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteCalendarEntry(id: string) {
    return apiFetch(`/calendar-entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getCalendarEntry(employeeId: string, date: string) {
    const entries = await apiFetch('/calendar-entries', { method: 'GET' });
    return entries.find(
      (e: any) => e.employeeId === employeeId && e.date === date
    );
  }
};

export const dayCommentApi = {
  async getComments() {
    return apiFetch('/day-comments', { method: 'GET' });
  },

  async setComment(date: string, comment: string) {
    return apiFetch('/day-comments', {
      method: 'POST',
      body: JSON.stringify({ date, comment })
    });
  }
};

export default api;