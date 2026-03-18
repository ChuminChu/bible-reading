import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import * as progressService from '@/services/progressService';
import { TOTAL_READING_DAYS } from '@/lib/constants';
import type { ReadingProgress } from '@/types/progress';

interface ReadingProgressContextValue {
  progress: Map<number, ReadingProgress>;
  loading: boolean;
  toggleDay: (dayNumber: number) => Promise<void>;
  markDayComplete: (dayNumber: number, completed: boolean) => Promise<void>;
  completedCount: number;
  overallProgress: number;
  isDayCompleted: (dayNumber: number) => boolean;
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | undefined>(undefined);

/**
 * Try an async operation; on failure refresh the Supabase session and retry once.
 * Uses refreshSession() instead of getSession() because getSession() only reads
 * from local cache and does NOT renew an expired access token.
 */
async function withSessionRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    // Actually refresh the auth token (getSession only reads cache)
    await supabase.auth.refreshSession();
    return await fn();
  }
}

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<number, ReadingProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProgress(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);

    let cancelled = false;
    const load = async () => {
      try {
        const data = await withSessionRetry(() =>
          progressService.getReadingProgress(user.id),
        );
        if (cancelled) return;
        const map = new Map<number, ReadingProgress>();
        data.forEach((p) => map.set(p.dayNumber, p));
        setProgress(map);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const toggleDay = useCallback(
    async (dayNumber: number) => {
      if (!user) return;

      const current = progress.get(dayNumber);
      const newCompleted = !current?.completed;

      // Optimistic update
      setProgress((prev) => {
        const next = new Map(prev);
        next.set(dayNumber, {
          dayNumber,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null,
        });
        return next;
      });

      try {
        await withSessionRetry(() =>
          progressService.toggleDayComplete(user.id, dayNumber, newCompleted),
        );
      } catch (err) {
        console.error('Failed to toggle day:', err);
        // Revert on error
        setProgress((prev) => {
          const next = new Map(prev);
          if (current) {
            next.set(dayNumber, current);
          } else {
            next.delete(dayNumber);
          }
          return next;
        });
      }
    },
    [user, progress],
  );

  const markDayComplete = useCallback(
    async (dayNumber: number, completed: boolean) => {
      if (!user) return;

      // Optimistic update
      setProgress((prev) => {
        const next = new Map(prev);
        next.set(dayNumber, {
          dayNumber,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return next;
      });

      try {
        await withSessionRetry(() =>
          progressService.toggleDayComplete(user.id, dayNumber, completed),
        );
      } catch (err) {
        console.error('Failed to mark day:', err);
      }
    },
    [user],
  );

  const completedCount = Array.from(progress.values()).filter((p) => p.completed).length;
  const overallProgress = Math.round((completedCount / TOTAL_READING_DAYS) * 100);

  const isDayCompleted = useCallback(
    (dayNumber: number) => progress.get(dayNumber)?.completed ?? false,
    [progress],
  );

  return (
    <ReadingProgressContext.Provider
      value={{
        progress,
        loading,
        toggleDay,
        markDayComplete,
        completedCount,
        overallProgress,
        isDayCompleted,
      }}
    >
      {children}
    </ReadingProgressContext.Provider>
  );
}

export function useReadingProgress(): ReadingProgressContextValue {
  const context = useContext(ReadingProgressContext);
  if (context === undefined) {
    throw new Error('useReadingProgress must be used within ReadingProgressProvider');
  }
  return context;
}
