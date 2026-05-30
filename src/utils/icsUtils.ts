interface ICSEntry {
  date: string;
  shiftName: string;
  shiftTimes: string;
  tasks: string;
}

export const generateICS = (userName: string, entries: ICSEntry[]): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Acamed Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const entry of entries) {
    const dateStr = entry.date.replace(/-/g, '');
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${entry.date}-${userName.replace(/\s/g, '')}@acamed-calendar`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    lines.push(`SUMMARY:${entry.shiftName}`);
    
    const description = [entry.shiftTimes, entry.tasks].filter(Boolean).join('\n');
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

export default generateICS;