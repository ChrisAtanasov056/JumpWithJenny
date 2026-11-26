export const WORKOUT_TIME_ZONE = 'Europe/Sofia';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const parseWorkoutDate = (dateValue) => {
  if (!dateValue) return null;
  const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() <= 1) {
    return null;
  }
  return parsed;
};

export const formatWorkoutDateBg = (dateValue) => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) return '-';
  return new Intl.DateTimeFormat('bg-BG', {
    timeZone: WORKOUT_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

export const formatWorkoutDateTimeBg = (dateValue) => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) return '-';
  return new Intl.DateTimeFormat('bg-BG', {
    timeZone: WORKOUT_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
};

export const getSofiaDateParts = (dateValue) => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) {
    return { datePart: '', timePart: '', dayName: '' };
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WORKOUT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = lookup.hour === '24' ? '00' : lookup.hour;
  const datePart = `${lookup.year}-${lookup.month}-${lookup.day}`;
  const timePart = `${hour}:${lookup.minute}`;
  const dayName = getWeekdayNameFromDatePart(datePart);

  return { datePart, timePart, dayName };
};

export const formatWorkoutDateForInput = (dateValue) => {
  const { datePart, timePart } = getSofiaDateParts(dateValue);
  if (!datePart || !timePart) return '';
  return `${datePart}T${timePart}`;
};

export const getWeekdayNameFromDatePart = (datePart) => {
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return '';
  }
  const [year, month, day] = datePart.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(utcDate.getTime())) {
    return '';
  }
  return WEEKDAY_NAMES[utcDate.getUTCDay()];
};

export const addDaysToDatePart = (datePart, days) => {
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return '';
  }
  const [year, month, day] = datePart.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getNextMondayDatePart = () => {
  const nowParts = getSofiaDateParts(new Date());
  if (!nowParts.datePart) return '';
  const [year, month, day] = nowParts.datePart.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const currentDay = utc.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntilNextMon = currentDay === 1 ? 7 : ((8 - currentDay) % 7 || 7);
  return addDaysToDatePart(nowParts.datePart, daysUntilNextMon);
};
