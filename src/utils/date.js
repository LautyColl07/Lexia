const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function normalizeDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isSameDay(dateA, dateB) {
  const first = normalizeDate(dateA);
  const second = normalizeDate(dateB);

  if (!first || !second) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function isToday(dateValue) {
  return isSameDay(normalizeDate(dateValue), new Date());
}

export function formatShortDate(dateValue) {
  const date = normalizeDate(dateValue);

  if (!date) {
    return 'SIN FECHA';
  }

  if (isToday(date)) {
    return 'HOY';
  }

  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
}

export function formatTime(dateValue) {
  const date = normalizeDate(dateValue);

  if (!date) {
    return '--:--';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatLongDate(dateValue) {
  const date = normalizeDate(dateValue);

  if (!date) {
    return 'Sin fecha';
  }

  const month = MONTHS[date.getMonth()].toLowerCase();

  return `${String(date.getDate()).padStart(2, '0')} ${month} ${date.getFullYear()}`;
}

export function formatDateTimeInput(date, time) {
  const normalized = normalizeDate(`${date}T${time}:00`);
  return normalized ? normalized.toISOString() : null;
}

export function isUpcoming(dateValue) {
  const date = normalizeDate(dateValue);
  return Boolean(date && date.getTime() >= Date.now());
}

export function sortByDateAsc(items, key = 'date') {
  return [...items].sort((first, second) => {
    const firstDate = normalizeDate(first[key]);
    const secondDate = normalizeDate(second[key]);
    const firstTime = firstDate ? firstDate.getTime() : Number.MAX_SAFE_INTEGER;
    const secondTime = secondDate ? secondDate.getTime() : Number.MAX_SAFE_INTEGER;

    return firstTime - secondTime;
  });
}

export function matchesCalendarFilter(dateValue, filter) {
  const date = normalizeDate(dateValue);

  if (!date) {
    return false;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  if (filter === 'today') {
    return date >= startOfToday && date <= endOfToday;
  }

  if (filter === 'week') {
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfToday && date <= endOfWeek;
  }

  if (filter === 'month') {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  return true;
}
