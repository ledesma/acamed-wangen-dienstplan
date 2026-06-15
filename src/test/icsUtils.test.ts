import { describe, it, expect } from 'vitest';
import { generateICS } from '../utils/icsUtils';

describe('icsUtils', () => {
  describe('generateICS', () => {
    it('should generate valid ICS content', () => {
      const entries = [
        {
          date: '2024-06-15',
          shiftName: 'Morning',
          shiftTimes: '08:00 - 16:00',
          tasks: 'Patient Care, Documentation'
        }
      ];

      const ics = generateICS('John Doe', entries);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should create event with correct summary', () => {
      const entries = [
        {
          date: '2024-06-15',
          shiftName: 'Morning Shift',
          shiftTimes: '',
          tasks: ''
        }
      ];

      const ics = generateICS('User', entries);

      expect(ics).toContain('SUMMARY:Morning Shift');
    });

    it('should handle multiple entries', () => {
      const entries = [
        {
          date: '2024-06-15',
          shiftName: 'Morning',
          shiftTimes: '08:00 - 16:00',
          tasks: 'Task 1'
        },
        {
          date: '2024-06-16',
          shiftName: 'Evening',
          shiftTimes: '16:00 - 22:00',
          tasks: 'Task 2'
        }
      ];

      const ics = generateICS('User', entries);

      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(2);
    });

    it('should include description when tasks are present', () => {
      const entries = [
        {
          date: '2024-06-15',
          shiftName: 'Morning',
          shiftTimes: '08:00 - 16:00',
          tasks: 'Patient Care'
        }
      ];

      const ics = generateICS('User', entries);

      expect(ics).toContain('DESCRIPTION:');
    });
  });
});