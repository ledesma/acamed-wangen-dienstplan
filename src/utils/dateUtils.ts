import i18n from '../i18n';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getWeekDates = (date: Date): Date[] => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(d);
    dates.push(current);
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

export const getWeekKey = (date: Date): string => {
  const dates = getWeekDates(date);
  return `${formatDate(dates[0])}-${formatDate(dates[6])}`;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const getDayName = (date: Date, short = false): string => {
  return short ? i18n.t(`days_short.${date.getDay()}`) : i18n.t(`days_long.${date.getDay()}`);
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'long' });
};

export const getMonthDates = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  const dates: (Date | null)[] = [];
  
  for (let i = 0; i < startPadding; i++) {
    dates.push(null);
  }
  
  for (let i = 1; i <= totalDays; i++) {
    dates.push(new Date(year, month, i));
  }
  
  return dates;
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export const formatTimeRange = (from: string, to: string): string => {
  return `${formatTime(from)} - ${formatTime(to)}`;
};

export const formatShiftTimes = (times: { from: string; to: string }[]): string => {
  return times.map(t => formatTimeRange(t.from, t.to)).join(', ');
};