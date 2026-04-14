import { useState, useEffect, useCallback } from 'react';
import { getBibleChapter } from '@/services/bibleService';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import type { BibleChapter } from '@/types/bible';

export function useBibleText(bookCode: string, chapter: number) {
  const { version } = useBibleVersion();
  const [data, setData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!bookCode || !chapter) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBibleChapter(version, bookCode, chapter)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('성경 텍스트를 불러오지 못했습니다.');
          setLoading(false);
          console.error('Bible text error:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [version, bookCode, chapter, reloadKey]);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return { data, loading, error, refetch };
}
