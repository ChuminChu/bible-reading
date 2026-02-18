import { useState, useEffect } from 'react';
import { getBibleChapter } from '@/services/bibleService';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import type { BibleChapter } from '@/types/bible';

export function useBibleText(bookCode: string, chapter: number) {
  const { version } = useBibleVersion();
  const [data, setData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [version, bookCode, chapter]);

  return { data, loading, error };
}
