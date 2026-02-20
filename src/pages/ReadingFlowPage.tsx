import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBibleText } from '@/hooks/useBibleText';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useAuth } from '@/contexts/AuthContext';
import { getDayPlan } from '@/data/readingPlan';
import { getBookByCode } from '@/data/bibleBooks';
import { getDayNumber } from '@/lib/dayCalculation';
import * as progressService from '@/services/progressService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronLeft, ArrowLeftRight, Check } from 'lucide-react';
import type { ReadingRange } from '@/types/plan';

interface ChapterItem {
  bookCode: string;
  bookName: string;
  chapter: number;
  label: string;
}

function expandRanges(ranges: ReadingRange[]): ChapterItem[] {
  const items: ChapterItem[] = [];
  for (const range of ranges) {
    const book = getBookByCode(range.bookCode);
    const bookName = book?.name ?? range.bookCode;
    for (let ch = range.startChapter; ch <= range.endChapter; ch++) {
      items.push({
        bookCode: range.bookCode,
        bookName,
        chapter: ch,
        label: `${bookName} ${ch}장`,
      });
    }
  }
  return items;
}

export default function ReadingFlowPage() {
  const { dayNumber: dayParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { version, setVersion, versionName } = useBibleVersion();
  const { markDayComplete } = useReadingProgress();

  const dayNumber = dayParam ? Number(dayParam) : getDayNumber(new Date()) ?? 1;
  const plan = getDayPlan(dayNumber);
  const chapters = plan ? expandRanges(plan.ranges) : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [checkedSet, setCheckedSet] = useState<Set<number>>(new Set());
  const [allDone, setAllDone] = useState(false);

  // Load chapter-level progress from Supabase
  useEffect(() => {
    if (!user || !plan) return;
    progressService.getChapterProgress(user.id).then((data) => {
      const checked = new Set<number>();
      chapters.forEach((ch, idx) => {
        if (data.some((p) => p.bookCode === ch.bookCode && p.chapterNumber === ch.chapter && p.completed)) {
          checked.add(idx);
        }
      });
      // If all chapters are already completed, show re-read prompt instead of auto-advancing
      if (checked.size === chapters.length && chapters.length > 0) {
        setCheckedSet(checked);
        setAllDone(true);
        return;
      }
      setCheckedSet(checked);
      // Start at first unchecked chapter
      const firstUnchecked = chapters.findIndex((_, i) => !checked.has(i));
      if (firstUnchecked >= 0) setCurrentIdx(firstUnchecked);
    });
  }, [user]);

  const current = chapters[currentIdx];
  const { data: bibleData, loading, error } = useBibleText(
    current?.bookCode ?? '',
    current?.chapter ?? 0,
  );

  const handleCheck = useCallback(async () => {
    if (!current || !user) return;

    // Mark chapter as completed
    const newChecked = new Set(checkedSet);
    newChecked.add(currentIdx);
    setCheckedSet(newChecked);

    // Save chapter to DB in background (don't block next-chapter advance)
    progressService.toggleChapterComplete(user.id, current.bookCode, current.chapter, true).catch(
      (err) => console.error('Failed to save chapter progress:', err),
    );

    // All chapters done? → await DB save before showing completion
    if (newChecked.size === chapters.length) {
      await markDayComplete(dayNumber, true);
      setAllDone(true);
      return;
    }

    // Advance to next unchecked chapter immediately
    const nextIdx = chapters.findIndex((_, i) => i > currentIdx && !newChecked.has(i));
    if (nextIdx >= 0) {
      setCurrentIdx(nextIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [current, currentIdx, checkedSet, chapters, user, dayNumber, markDayComplete]);

  const handleManualCheck = useCallback(async (idx: number) => {
    if (!user) return;
    const ch = chapters[idx];
    const isChecked = checkedSet.has(idx);
    const newChecked = new Set(checkedSet);

    if (isChecked) {
      newChecked.delete(idx);
    } else {
      newChecked.add(idx);
    }
    setCheckedSet(newChecked);

    // Save to DB in background
    progressService.toggleChapterComplete(user.id, ch.bookCode, ch.chapter, !isChecked).catch(
      (err) => console.error('Failed to save chapter progress:', err),
    );

    // Check if all done → await DB save
    if (newChecked.size === chapters.length) {
      await markDayComplete(dayNumber, true);
      setAllDone(true);
    }
  }, [checkedSet, chapters, user, dayNumber, markDayComplete]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-4">
        <p className="text-text-secondary">해당 일차의 통독 계획이 없습니다.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 font-medium">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const handleRestart = useCallback(async () => {
    if (!user) return;
    // Reset all chapter progress for this day's chapters
    for (const ch of chapters) {
      await progressService.toggleChapterComplete(user.id, ch.bookCode, ch.chapter, false);
    }
    // Reset day completion
    await markDayComplete(dayNumber, false);
    setCheckedSet(new Set());
    setCurrentIdx(0);
    setAllDone(false);
    window.scrollTo(0, 0);
  }, [user, chapters, dayNumber]);

  // All done screen
  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
          <Check size={40} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">오늘의 통독 완료!</h1>
        <p className="text-text-secondary text-center mb-2">
          Day {dayNumber} — {plan.label}
        </p>
        <p className="text-sm text-text-muted text-center mb-8">
          {chapters.length}장을 모두 읽었습니다. 수고하셨습니다!
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRestart}
            className="w-full px-8 py-3 border border-primary-300 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
          >
            다시 읽기
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const verses = bibleData
    ? Object.entries(bibleData.verses).sort(([a], [b]) => Number(a) - Number(b))
    : [];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-20">
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-text-secondary">
            <ChevronLeft size={20} />
            <span className="text-sm">홈</span>
          </button>
          <span className="text-sm font-medium text-text-primary">
            300일 성경1독
          </span>
          <span className="text-sm text-text-muted">
            {dayNumber}일차 ({currentIdx + 1}/{chapters.length})
          </span>
        </div>
      </div>

      {/* Chapter progress tracker */}
      <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-4">
          {/* Day info */}
          <div className="flex-shrink-0">
            <p className="text-2xl font-bold text-text-primary">{dayNumber}</p>
            <p className="text-xs text-text-muted">일차/288일</p>
          </div>

          {/* Chapter list */}
          <div className="flex-1 space-y-1.5">
            {chapters.map((ch, idx) => {
              const isChecked = checkedSet.has(idx);
              const isCurrent = idx === currentIdx && !isChecked;

              return (
                <button
                  key={`${ch.bookCode}-${ch.chapter}`}
                  onClick={() => {
                    if (!isChecked) setCurrentIdx(idx);
                  }}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {isChecked ? (
                    <Check size={14} className="text-primary-500 flex-shrink-0" />
                  ) : isCurrent ? (
                    <span className="text-primary-600 text-xs flex-shrink-0 font-bold">→</span>
                  ) : (
                    <span className="w-3.5 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'text-primary-600 font-semibold'
                        : isChecked
                          ? 'text-text-muted line-through'
                          : 'text-text-secondary'
                    }`}
                  >
                    {ch.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual check option */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-text-muted">성경책으로 읽었다면</span>
          <button
            onClick={() => handleManualCheck(currentIdx)}
            className="text-xs font-medium text-primary-600 border border-primary-200 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
          >
            직접체크하기
          </button>
        </div>
      </div>

      {/* Bible text */}
      {current && (
        <div className="px-4 mt-4 pb-28">
          {/* Chapter title */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              {current.bookName} {current.chapter}장
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs text-text-muted">{versionName}</span>
              <button
                onClick={() => setVersion(version === 'krv' ? 'nkrv' : 'krv')}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <ArrowLeftRight size={12} />
                역본변경
              </button>
            </div>
          </div>

          {/* Verses */}
          {loading ? (
            <LoadingSpinner message="말씀을 불러오는 중..." />
          ) : error || !bibleData ? (
            <div className="text-center py-8">
              <p className="text-text-secondary text-sm">
                {error || '성경 텍스트가 아직 준비되지 않았습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {verses.map(([num, text]) => (
                <p key={num} className="text-base leading-relaxed">
                  <sup className="text-xs text-primary-400 font-bold mr-1">{num}</sup>
                  <span className="text-text-primary">{text}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe z-20">
        <button
          onClick={handleCheck}
          className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm"
        >
          {checkedSet.size === chapters.length - 1 && !checkedSet.has(currentIdx)
            ? '체크하고 통독 완료'
            : '체크 후 다음 장으로'}
        </button>
      </div>
    </div>
  );
}
