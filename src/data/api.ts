const API_BASE = '/.netlify/functions';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const api = {
  async getUsers() {
    return apiFetch(`/users?t=${Date.now()}`, { method: 'GET' });
  },

  async syncIdentityUsers() {
    return apiFetch('/sync-users', { method: 'POST' });
  },

  async inviteUser(name: string, email: string, roles: ('admin' | 'employee')[]) {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, roles })
    });
  },

  async updateUser(id: string, updates: any) {
    return apiFetch('/users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    });
  },

  async deleteUser(id: string) {
    return apiFetch(`/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getShifts() {
    return apiFetch('/shifts', { method: 'GET' });
  },

  async createShift(shift: any) {
    const snakeShift = {
      id: shift.id,
      name: shift.name,
      times: shift.times,
      default_task_ids: shift.default_task_ids || [],
      color: shift.color,
      is_active: shift.is_active !== undefined ? shift.is_active : true
    };
    return apiFetch('/shifts', {
      method: 'POST',
      body: JSON.stringify(snakeShift)
    });
  },

  async updateShift(id: string, updates: any) {
    const snakeUpdates: Record<string, any> = {};
    if (updates.name !== undefined) snakeUpdates.name = updates.name;
    if (updates.times !== undefined) snakeUpdates.times = updates.times;
    if (updates.default_task_ids !== undefined) snakeUpdates.default_task_ids = updates.default_task_ids;
    if (updates.default_taskIds !== undefined) snakeUpdates.default_task_ids = updates.default_taskIds;
    if (updates.color !== undefined) snakeUpdates.color = updates.color;
    if (updates.is_active !== undefined) snakeUpdates.is_active = updates.is_active;
    if (updates.isActive !== undefined) snakeUpdates.is_active = updates.isActive;
    return apiFetch('/shifts', {
      method: 'PUT',
      body: JSON.stringify({ id, ...snakeUpdates })
    });
  },

  async deleteShift(id: string) {
    return apiFetch(`/shifts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getTasks() {
    return apiFetch('/tasks', { method: 'GET' });
  },

  async createTask(task: any) {
    const snakeTask = {
      id: task.id,
      name: task.name,
      icon: task.icon,
      is_active: task.is_active !== undefined ? task.is_active : true
    };
    return apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(snakeTask)
    });
  },

  async updateTask(id: string, updates: any) {
    const snakeUpdates: Record<string, any> = {};
    if (updates.name !== undefined) snakeUpdates.name = updates.name;
    if (updates.icon !== undefined) snakeUpdates.icon = updates.icon;
    if (updates.is_active !== undefined) snakeUpdates.is_active = updates.is_active;
    if (updates.isActive !== undefined) snakeUpdates.is_active = updates.isActive;
    return apiFetch('/tasks', {
      method: 'PUT',
      body: JSON.stringify({ id, ...snakeUpdates })
    });
  },

  async deleteTask(id: string) {
    return apiFetch(`/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getRosterEntries(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/roster-entries${query}`, { method: 'GET' });
  },

  async createRosterEntry(entry: any) {
    const snakeEntry = {
      id: entry.id,
      user_id: entry.userId || entry.user_id,
      date: entry.date,
      shift_id: (entry.shiftId || entry.shift_id) || null,
      active_task_ids: entry.activeTaskIds || entry.active_task_ids || [],
      comment: entry.comment
    };
    return apiFetch('/roster-entries', {
      method: 'POST',
      body: JSON.stringify(snakeEntry)
    });
  },

  async updateRosterEntry(id: string, updates: any) {
    const snakeUpdates: Record<string, any> = {};
    if (updates.shift_id !== undefined) snakeUpdates.shift_id = updates.shift_id;
    if (updates.shiftId !== undefined) snakeUpdates.shift_id = updates.shiftId;
    if (updates.active_task_ids !== undefined) snakeUpdates.active_task_ids = updates.active_task_ids;
    if (updates.activeTaskIds !== undefined) snakeUpdates.active_task_ids = updates.activeTaskIds;
    if (updates.comment !== undefined) snakeUpdates.comment = updates.comment;
    return apiFetch('/roster-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...snakeUpdates })
    });
  },

  async deleteRosterEntry(id: string) {
    return apiFetch(`/roster-entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getRosterEntry(userId: string, date: string) {
    const entries = await apiFetch(`/roster-entries?from=${date}&to=${date}`, { method: 'GET' });
    return entries.find(
      (e: any) => e.user_id === userId && e.date === date
    );
  }
};

export const dayCommentApi = {
  async getComments() {
    return apiFetch('/day-comments', { method: 'GET' });
  },

  async setComment(date: string, comment: string, userId?: string) {
    return apiFetch('/day-comments', {
      method: 'POST',
      body: JSON.stringify({ date, comment, user_id: userId })
    });
  },

  async deleteComment(date: string, userId?: string) {
    return apiFetch('/day-comments', {
      method: 'POST',
      body: JSON.stringify({ date, comment: '', user_id: userId })
    });
  }
};

export default api;
