import { useEffect, useRef } from 'react';
import { useBibleText } from '@/hooks/useBibleText';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import { getBookByCode } from '@/data/bibleBooks';
import LoadingSpinner from './LoadingSpinner';
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';

interface BibleReaderProps {
  bookCode: string;
  chapter: number;
  fontSize?: number;
  startVerse?: number;
  onChapterChange?: (chapter: number) => void;
}

export default function BibleReader({
  bookCode,
  chapter,
  fontSize = 18,
  startVerse,
  onChapterChange,
}: BibleReaderProps) {
  const { data, loading, error } = useBibleText(bookCode, chapter);
  const { version, setVersion, versionName } = useBibleVersion();
  const book = getBookByCode(bookCode);
  const verseRef = useRef<HTMLParagraphElement>(null);

  // Scroll to startVerse when data loads
  useEffect(() => {
    if (startVerse && startVerse > 1 && !loading && data) {
      setTimeout(() => {
        verseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [startVerse, loading, data]);

  if (loading) return <LoadingSpinner message="말씀을 불러오는 중..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-text-secondary">
          {error || '성경 텍스트가 아직 준비되지 않았습니다.'}
        </p>
        <p className="text-sm text-text-muted mt-2">
          데이터가 업로드되면 이곳에서 읽을 수 있습니다.
        </p>
      </div>
    );
  }

  const verses = Object.entries(data.verses).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  const canGoPrev = chapter > 1;
  const canGoNext = book ? chapter < book.chapters : false;

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm py-3 flex items-center justify-between z-10">
        <h2 className="text-lg font-bold text-text-primary">
          {book?.name} {chapter}장
        </h2>
        <button
          onClick={() => setVersion(version === 'krv' ? 'nkrv' : 'krv')}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <ArrowLeftRight size={14} />
          {versionName}
        </button>
      </div>

      {/* Verses */}
      <div className="space-y-2 mt-2" style={{ fontSize: `${fontSize}px` }}>
        {verses.map(([num, text]) => (
          <p
            key={num}
            ref={startVerse && Number(num) === startVerse ? verseRef : undefined}
            className="leading-relaxed"
          >
            <sup className="text-xs text-primary-400 font-medium mr-1">{num}</sup>
            <span className="text-text-primary">{text}</span>
          </p>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
        <button
          onClick={() => canGoPrev && onChapterChange?.(chapter - 1)}
          disabled={!canGoPrev}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          이전 장
        </button>
        <span className="text-sm text-text-muted">
          {chapter} / {book?.chapters}
        </span>
        <button
          onClick={() => canGoNext && onChapterChange?.(chapter + 1)}
          disabled={!canGoNext}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          다음 장
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
