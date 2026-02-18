export interface ReadingProgress {
  dayNumber: number;
  completed: boolean;
  completedAt: string | null;
}

export interface ChapterProgress {
  bookCode: string;
  chapterNumber: number;
  completed: boolean;
  completedAt: string | null;
}

export interface UserPreferences {
  bibleVersion: 'krv' | 'nkrv';
  startDate: string;
  fontSize: number;
}
