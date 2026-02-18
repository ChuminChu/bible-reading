import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as progressService from '@/services/progressService';
import { TOTAL_READING_DAYS } from '@/lib/constants';
import type { ReadingProgress } from '@/types/progress';

export function useReadingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<number, ReadingProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProgress(new Map());
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await progressService.getReadingProgress(user.id);
        const map = new Map<number, ReadingProgress>();
        data.forEach((p) => map.set(p.dayNumber, p));
        setProgress(map);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

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
        await progressService.toggleDayComplete(user.id, dayNumber, newCompleted);
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

  const completedCount = Array.from(progress.values()).filter((p) => p.completed).length;
  const overallProgress = Math.round((completedCount / TOTAL_READING_DAYS) * 100);

  const isDayCompleted = useCallback(
    (dayNumber: number) => progress.get(dayNumber)?.completed ?? false,
    [progress],
  );

  return {
    progress,
    loading,
    toggleDay,
    completedCount,
    overallProgress,
    isDayCompleted,
  };
}
