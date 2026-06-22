const formatICSDateTime = (dateStr: string): string => {
  return dateStr.replace(/-/g, '') + 'T000000';
};

export const generateICS = (user: any, rosterEntries: any[], shifts: any[], tasks: any[]): string => {
  const userEntries = rosterEntries
    .filter((e: any) => e.user_id === user.id)
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Acamed Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${user.name}`,
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  ];

  for (const entry of userEntries) {
    const shift = shifts.find((s: any) => s.id === entry.shift_id);
    if (!shift) continue;

    const entryTasks = (entry.active_task_ids || [])
      .map((id: string) => tasks.find((t: any) => t.id === id))
      .filter(Boolean);

    const dateStr = entry.date.replace(/-/g, '');
    const uid = `${entry.id}-acamed-calendar`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    lines.push(`SUMMARY:${shift.name}`);

    const description = [shift.times.map((t: any) => `${t.from} - ${t.to}`).join('; '), entryTasks.map((t: any) => t.name).join('; ')].filter(Boolean).join('\n');
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }

    if (shift.color) {
      lines.push(`COLOR:RGB`);
      lines.push(`X-APPLE-TRAVEL-REMINDER;VALUE=BOOLEAN:TRUE`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
};
