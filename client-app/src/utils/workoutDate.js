export const WORKOUT_TIME_ZONE = 'Europe/Sofia';

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

export const formatWorkoutDateForInput = (dateValue) => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) return '';

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
  return `${lookup.year}-${lookup.month}-${lookup.day}T${hour}:${lookup.minute}`;
};
