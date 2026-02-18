import { useMemo } from 'react';
import { getDayNumber, isSunday } from '@/lib/dayCalculation';
import { getDayPlan } from '@/data/readingPlan';
import { START_DATE } from '@/lib/constants';
import type { DayPlan } from '@/types/plan';

interface TodayReading {
  dayNumber: number | null;
  plan: DayPlan | undefined;
  isSunday: boolean;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
}

export function useTodayReading(): TodayReading {
  return useMemo(() => {
    const today = new Date();
    const dayNumber = getDayNumber(today);
    const sunday = isSunday(today);

    return {
      dayNumber,
      plan: dayNumber ? getDayPlan(dayNumber) : undefined,
      isSunday: sunday,
      isBeforeStart: dayNumber === null && !sunday && today < START_DATE,
      isAfterEnd: dayNumber === null && !sunday && today >= START_DATE,
    };
  }, []);
}
