import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  parseDate,
  getWeekDates,
  getWeekKey,
  addWeeks,
  isSameDay,
  isToday,
  getDayName,
  getMonthName,
  getMonthDates,
  formatTime,
  formatTimeRange,
  formatShiftTimes
} from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      expect(formatDate(date)).toBe('2024-06-15');
    });
  });

  describe('parseDate', () => {
    it('should parse date string to Date object', () => {
      const date = parseDate('2024-06-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('getWeekDates', () => {
    it('should return 7 dates starting from Monday', () => {
      const wednesday = new Date('2024-06-12');
      const weekDates = getWeekDates(wednesday);
      
      expect(weekDates.length).toBe(7);
      expect(weekDates[0].getDay()).toBe(1);
    });

    it('should handle Sunday correctly', () => {
      const sunday = new Date('2024-06-16');
      const weekDates = getWeekDates(sunday);
      
      expect(weekDates.length).toBe(7);
      expect(weekDates[0].getDay()).toBe(1);
    });
  });

  describe('getWeekKey', () => {
    it('should return week key in format start-end', () => {
      const wednesday = new Date('2024-06-12');
      const key = getWeekKey(wednesday);
      
      expect(key).toContain('-');
      const parts = key.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('addWeeks', () => {
    it('should add weeks to date', () => {
      const date = new Date('2024-06-12');
      const result = addWeeks(date, 2);
      
      expect(result.getDate()).toBe(26);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-06-12');
      const date2 = new Date('2024-06-12');
      
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-06-12');
      const date2 = new Date('2024-06-13');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('getDayName', () => {
    it('should return full day name', () => {
      const monday = new Date('2024-06-10');
      expect(getDayName(monday)).toBe('Monday');
    });

    it('should return short day name', () => {
      const monday = new Date('2024-06-10');
      expect(getDayName(monday, true)).toBe('Mon');
    });
  });

  describe('getMonthName', () => {
    it('should return month name', () => {
      const june = new Date('2024-06-15');
      expect(getMonthName(june)).toBe('June');
    });
  });

  describe('formatTime', () => {
    it('should format time in 24h format', () => {
      expect(formatTime('08:00')).toBe('08:00');
      expect(formatTime('14:30')).toBe('14:30');
      expect(formatTime('00:00')).toBe('00:00');
      expect(formatTime('12:00')).toBe('12:00');
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range', () => {
      expect(formatTimeRange('08:00', '16:00')).toBe('08:00 - 16:00');
    });
  });

  describe('formatShiftTimes', () => {
    it('should format multiple shift times', () => {
      const times = [
        { from: '08:00', to: '12:00' },
        { from: '17:00', to: '21:00' }
      ];
      expect(formatShiftTimes(times)).toBe('08:00 - 12:00, 17:00 - 21:00');
    });
  });
});