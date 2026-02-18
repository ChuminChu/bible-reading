export interface ReadingRange {
  bookCode: string;
  startChapter: number;
  endChapter: number;
}

export interface DayPlan {
  dayNumber: number;
  ranges: ReadingRange[];
  label: string; // e.g. "창 1-4"
}

export interface WeekGroup {
  weekNumber: number;
  days: DayPlan[];
  startDate: Date;
}
