export interface DayCommentWithUsers {
  global: string;
  employees: Record<string, string>;
}

const escapeICSText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const generateICS = (
  user: any,
  rosterEntries: any[],
  shifts: any[],
  tasks: any[],
  dayComments: Record<string, DayCommentWithUsers> = {}
): string => {
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

    const dayComment = dayComments[entry.date];
    const globalComment = dayComment?.global || '';
    const userComment = dayComment?.employees?.[entry.user_id] || '';

    const description = [
      entryTasks.map((t: any) => t.name).join(', '),
      globalComment,
      userComment
    ].filter(Boolean).join('\n\n');

    const dateStr = entry.date.replace(/-/g, '');
    const timeBlocks: Array<{ from: string; to: string } | null> =
      shift.times && shift.times.length > 0 ? shift.times : [null];

    timeBlocks.forEach((block, index) => {
      const uid = block
        ? `${entry.id}-${index}-acamed-calendar`
        : `${entry.id}-acamed-calendar`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

      if (block) {
        const fromCompact = `${block.from.replace(':', '')}00`;
        const toCompact = `${block.to.replace(':', '')}00`;
        const toDateStr = block.to <= block.from ? addDays(entry.date, 1).replace(/-/g, '') : dateStr;

        lines.push(`DTSTART;TZID=Europe/Berlin:${dateStr}T${fromCompact}`);
        lines.push(`DTEND;TZID=Europe/Berlin:${toDateStr}T${toCompact}`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
        lines.push(`DTEND;VALUE=DATE:${dateStr}`);
      }

      lines.push(`SUMMARY:${escapeICSText(shift.name)}`);
      if (description) {
        lines.push(`DESCRIPTION:${escapeICSText(description)}`);
      }

      lines.push('END:VEVENT');
    });
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
};
