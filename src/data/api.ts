const API_BASE = '/.netlify/functions';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
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

  async syncIdentityUsers() {
    return apiFetch('/sync-users', { method: 'POST' });
  },

  async inviteEmployee(name: string, email: string, role: 'admin' | 'user') {
    return apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
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

  async getRosterEntries() {
    return apiFetch('/roster-entries', { method: 'GET' });
  },

  async createRosterEntry(entry: any) {
    return apiFetch('/roster-entries', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  },

  async updateRosterEntry(id: string, updates: any) {
    return apiFetch('/roster-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteRosterEntry(id: string) {
    return apiFetch(`/roster-entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getRosterEntry(employeeId: string, date: string) {
    const entries = await apiFetch('/roster-entries', { method: 'GET' });
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
