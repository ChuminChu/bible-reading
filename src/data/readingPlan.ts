import type { DayPlan, ReadingRange } from '../types/plan';
import { OT_DAYS, NT_DAYS } from '../lib/constants';
import { getBookByCode, getBooksByTestament } from './bibleBooks';
import type { BibleBook } from '../types/bible';

// ─── Internal helpers ────────────────────────────────────────────────

/**
 * Builds a flat list of { bookCode, chapter } entries for every chapter in the
 * given book list, preserving canonical order.
 */
function flattenChapters(books: BibleBook[]): { bookCode: string; chapter: number }[] {
  const result: { bookCode: string; chapter: number }[] = [];
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      result.push({ bookCode: book.code, chapter: ch });
    }
  }
  return result;
}

/**
 * Distribute `totalChapters` chapters across `totalDays` days as evenly as
 * possible.  Returns an array of length `totalDays` where each element is the
 * number of chapters to read that day.
 *
 * Uses an accumulator approach so the remainder is spread across days rather
 * than lumped at the end.
 */
function distributeCounts(totalChapters: number, totalDays: number): number[] {
  const counts: number[] = [];
  let assigned = 0;

  for (let day = 0; day < totalDays; day++) {
    // How many chapters *should* have been read by end of this day?
    const targetCumulative = Math.round(((day + 1) * totalChapters) / totalDays);
    const todayCount = targetCumulative - assigned;
    counts.push(todayCount);
    assigned += todayCount;
  }

  return counts;
}

/**
 * Compress a list of { bookCode, chapter } entries into contiguous
 * ReadingRange objects. Consecutive chapters within the same book are merged
 * into a single range.
 */
function compressToRanges(
  chapters: { bookCode: string; chapter: number }[],
): ReadingRange[] {
  if (chapters.length === 0) return [];

  const ranges: ReadingRange[] = [];
  let current: ReadingRange = {
    bookCode: chapters[0].bookCode,
    startChapter: chapters[0].chapter,
    endChapter: chapters[0].chapter,
  };

  for (let i = 1; i < chapters.length; i++) {
    const ch = chapters[i];
    if (
      ch.bookCode === current.bookCode &&
      ch.chapter === current.endChapter + 1
    ) {
      // Extend current range
      current.endChapter = ch.chapter;
    } else {
      ranges.push(current);
      current = {
        bookCode: ch.bookCode,
        startChapter: ch.chapter,
        endChapter: ch.chapter,
      };
    }
  }
  ranges.push(current);
  return ranges;
}

/**
 * Build a human-readable Korean label for a day's reading ranges.
 * Examples:
 *   - "창 1-4"
 *   - "창 49-50, 출 1-2"
 *   - "옵 1"               (single chapter)
 */
function buildLabel(ranges: ReadingRange[]): string {
  return ranges
    .map((r) => {
      const book = getBookByCode(r.bookCode);
      const name = book ? book.name : r.bookCode;
      // Use a short name: strip trailing 서/기 for brevity where the full name
      // is unambiguous? -- Actually, Korean Bible apps typically use the full
      // name. We'll use a short-name map for the most common abbreviations.
      const shortName = getShortName(name);
      if (r.startChapter === r.endChapter) {
        return `${shortName} ${r.startChapter}`;
      }
      return `${shortName} ${r.startChapter}-${r.endChapter}`;
    })
    .join(', ');
}

/**
 * Return a conventional short Korean name for labelling.
 * Many Korean Bible apps abbreviate to 1-2 character forms.
 */
function getShortName(fullName: string): string {
  const map: Record<string, string> = {
    창세기: '창',
    출애굽기: '출',
    레위기: '레',
    민수기: '민',
    신명기: '신',
    여호수아: '수',
    사사기: '삿',
    룻기: '룻',
    사무엘상: '삼상',
    사무엘하: '삼하',
    열왕기상: '왕상',
    열왕기하: '왕하',
    역대상: '대상',
    역대하: '대하',
    에스라: '스',
    느헤미야: '느',
    에스더: '에',
    욥기: '욥',
    시편: '시',
    잠언: '잠',
    전도서: '전',
    아가: '아',
    이사야: '사',
    예레미야: '렘',
    예레미야애가: '애',
    에스겔: '겔',
    다니엘: '단',
    호세아: '호',
    요엘: '욜',
    아모스: '암',
    오바댜: '옵',
    요나: '욘',
    미가: '미',
    나훔: '나',
    하박국: '합',
    스바냐: '습',
    학개: '학',
    스가랴: '슥',
    말라기: '말',
    마태복음: '마',
    마가복음: '막',
    누가복음: '눅',
    요한복음: '요',
    사도행전: '행',
    로마서: '롬',
    고린도전서: '고전',
    고린도후서: '고후',
    갈라디아서: '갈',
    에베소서: '엡',
    빌립보서: '빌',
    골로새서: '골',
    데살로니가전서: '살전',
    데살로니가후서: '살후',
    디모데전서: '딤전',
    디모데후서: '딤후',
    디도서: '딛',
    빌레몬서: '몬',
    히브리서: '히',
    야고보서: '약',
    베드로전서: '벧전',
    베드로후서: '벧후',
    요한1서: '요일',
    요한2서: '요이',
    요한3서: '요삼',
    유다서: '유',
    요한계시록: '계',
  };
  return map[fullName] ?? fullName;
}

// ─── Plan generation ─────────────────────────────────────────────────

/**
 * Generate the full 288-day reading plan.
 *
 * Days 1-216  : Old Testament (929 chapters across 216 days)
 * Days 217-288: New Testament (260 chapters across 72 days)
 */
export function generateReadingPlan(): DayPlan[] {
  const plan: DayPlan[] = [];

  // --- Old Testament ---
  const otBooks = getBooksByTestament('OT');
  const otChapters = flattenChapters(otBooks);
  const otCounts = distributeCounts(otChapters.length, OT_DAYS);

  let chapterIdx = 0;
  for (let day = 0; day < OT_DAYS; day++) {
    const count = otCounts[day];
    const dayChapters = otChapters.slice(chapterIdx, chapterIdx + count);
    chapterIdx += count;

    const ranges = compressToRanges(dayChapters);
    plan.push({
      dayNumber: day + 1,
      ranges,
      label: buildLabel(ranges),
    });
  }

  // --- New Testament ---
  const ntBooks = getBooksByTestament('NT');
  const ntChapters = flattenChapters(ntBooks);
  const ntCounts = distributeCounts(ntChapters.length, NT_DAYS);

  chapterIdx = 0;
  for (let day = 0; day < NT_DAYS; day++) {
    const count = ntCounts[day];
    const dayChapters = ntChapters.slice(chapterIdx, chapterIdx + count);
    chapterIdx += count;

    const ranges = compressToRanges(dayChapters);
    plan.push({
      dayNumber: OT_DAYS + day + 1,
      ranges,
      label: buildLabel(ranges),
    });
  }

  return plan;
}

// ─── Cached plan & accessor ──────────────────────────────────────────

/** The complete 288-day reading plan (computed once). */
export const readingPlan: DayPlan[] = generateReadingPlan();

/** Look up a single day's plan by its 1-based day number. */
export function getDayPlan(dayNumber: number): DayPlan | undefined {
  if (dayNumber < 1 || dayNumber > readingPlan.length) return undefined;
  return readingPlan[dayNumber - 1];
}
