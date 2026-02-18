import { supabase } from '@/services/supabase';
import type {
  ReadingProgress,
  ChapterProgress,
  UserPreferences,
} from '@/types/progress';

export async function getReadingProgress(
  userId: string,
): Promise<ReadingProgress[]> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('day_number, completed, completed_at')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    dayNumber: row.day_number,
    completed: row.completed,
    completedAt: row.completed_at,
  }));
}

export async function toggleDayComplete(
  userId: string,
  dayNumber: number,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase.from('reading_progress').upsert(
    {
      user_id: userId,
      day_number: dayNumber,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,day_number' },
  );

  if (error) throw error;
}

export async function getChapterProgress(
  userId: string,
): Promise<ChapterProgress[]> {
  const { data, error } = await supabase
    .from('chapter_progress')
    .select('book_code, chapter_number, completed, completed_at')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    bookCode: row.book_code,
    chapterNumber: row.chapter_number,
    completed: row.completed,
    completedAt: row.completed_at,
  }));
}

export async function toggleChapterComplete(
  userId: string,
  bookCode: string,
  chapterNumber: number,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase.from('chapter_progress').upsert(
    {
      user_id: userId,
      book_code: bookCode,
      chapter_number: chapterNumber,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,book_code,chapter_number' },
  );

  if (error) throw error;
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('bible_version, start_date, font_size')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }

  return {
    bibleVersion: data.bible_version as UserPreferences['bibleVersion'],
    startDate: data.start_date,
    fontSize: data.font_size,
  };
}

export async function updateUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>,
): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId };

  if (prefs.bibleVersion !== undefined) row.bible_version = prefs.bibleVersion;
  if (prefs.startDate !== undefined) row.start_date = prefs.startDate;
  if (prefs.fontSize !== undefined) row.font_size = prefs.fontSize;

  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function resetProgress(userId: string): Promise<void> {
  const { error: readingError } = await supabase
    .from('reading_progress')
    .delete()
    .eq('user_id', userId);

  if (readingError) throw readingError;

  const { error: chapterError } = await supabase
    .from('chapter_progress')
    .delete()
    .eq('user_id', userId);

  if (chapterError) throw chapterError;
}
