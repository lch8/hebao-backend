// RFC 5545 (.ics) calendar export for community meetups and official Dutch city activities.

const pad2 = n => String(n).padStart(2, '0');

export function toIcsUtc(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (!Number.isFinite(d.getTime())) throw new Error('无效的日历时间');
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

const escIcs = value => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

export function buildCalendarIcs({
  uid,
  title,
  startsAt,
  endsAt,
  location = '',
  description = '',
  url = '',
  now = new Date(),
}) {
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime())) throw new Error('无效的活动开始时间');
  const parsedEnd = endsAt ? new Date(endsAt) : null;
  const end = parsedEnd && Number.isFinite(parsedEnd.getTime()) && parsedEnd.getTime() > start.getTime()
    ? parsedEnd
    : new Date(start.getTime() + 2 * 3600000);
  const safeUid = `${String(uid || crypto.randomUUID()).replace(/[^A-Za-z0-9._-]/g, '-')}@hebaogj.xyz`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hebao//NL Community & Events//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${safeUid}`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escIcs(title || '荷包同城活动')}`,
  ];
  if (location) lines.push(`LOCATION:${escIcs(location)}`);
  if (description) lines.push(`DESCRIPTION:${escIcs(description)}`);
  if (url) lines.push(`URL:${escIcs(url)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR', '');
  return lines.join('\r\n');
}

export function downloadCalendarIcs(spec, fileName = 'hebao-event.ics') {
  const content = buildCalendarIcs(spec);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName.endsWith('.ics') ? fileName : `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}
