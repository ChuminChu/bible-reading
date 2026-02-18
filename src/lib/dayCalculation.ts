import { differenceInCalendarDays, addDays, startOfDay } from 'date-fns';
import { START_DATE, TOTAL_READING_DAYS } from './constants';

/**
 * Returns the reading day number (1-based) for a given date.
 * Returns null if the date is a Sunday, before the start date, or after the plan ends.
 *
 * Schedule: Mon-Sat = reading days, Sunday = rest
 * daysSince = calendar days from START_DATE
 * week = Math.floor(daysSince / 7)
 * dow = daysSince % 7   (0=Mon, 1=Tue, ..., 5=Sat, 6=Sun)
 * dayNumber = week * 6 + dow + 1
 */
export function getDayNumber(date: Date): number | null {
  const normalized = startOfDay(date);
  const start = startOfDay(START_DATE);
  const daysSince = differenceInCalendarDays(normalized, start);

  if (daysSince < 0) return null;

  const week = Math.floor(daysSince / 7);
  const dow = daysSince % 7; // 0=Mon ... 5=Sat, 6=Sun

  if (dow === 6) return null; // Sunday

  const dayNumber = week * 6 + dow + 1;

  if (dayNumber > TOTAL_READING_DAYS) return null;

  return dayNumber;
}

/**
 * Returns the calendar date for a given reading day number (1-based).
 * dayNumber is 1-indexed: day 1 = START_DATE (Monday).
 *
 * Reverse of getDayNumber:
 *   zeroDay = dayNumber - 1
 *   week = Math.floor(zeroDay / 6)
 *   dayInWeek = zeroDay % 6
 *   calendarOffset = week * 7 + dayInWeek
 */
export function getDateForDay(dayNumber: number): Date {
  const zeroDay = dayNumber - 1;
  const week = Math.floor(zeroDay / 6);
  const dayInWeek = zeroDay % 6;
  const calendarOffset = week * 7 + dayInWeek;
  return addDays(startOfDay(START_DATE), calendarOffset);
}

/**
 * Returns true if the given date falls on a Sunday relative to the plan's
 * weekly cycle (START_DATE is Monday, so 6 days later is Sunday).
 */
export function isSunday(date: Date): boolean {
  const normalized = startOfDay(date);
  const start = startOfDay(START_DATE);
  const daysSince = differenceInCalendarDays(normalized, start);

  if (daysSince < 0) return false;

  return daysSince % 7 === 6;
}

/**
 * Returns the 0-indexed week number for a given date.
 * Week 0 starts on START_DATE.
 */
export function getCurrentWeek(date: Date): number {
  const normalized = startOfDay(date);
  const start = startOfDay(START_DATE);
  const daysSince = differenceInCalendarDays(normalized, start);

  if (daysSince < 0) return 0;

  return Math.floor(daysSince / 7);
}

/**
 * Returns all 7 dates (Mon-Sun) for the given 0-indexed week number.
 */
export function getWeekDates(weekNumber: number): Date[] {
  const weekStart = addDays(startOfDay(START_DATE), weekNumber * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
