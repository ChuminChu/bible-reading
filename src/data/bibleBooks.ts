import type { BibleBook, Testament } from '../types/bible';

export const bibleBooks: BibleBook[] = [
  // ── Old Testament (39 books, 929 chapters) ──
  { code: 'gen', name: '창세기', chapters: 50, testament: 'OT', order: 1 },
  { code: 'exo', name: '출애굽기', chapters: 40, testament: 'OT', order: 2 },
  { code: 'lev', name: '레위기', chapters: 27, testament: 'OT', order: 3 },
  { code: 'num', name: '민수기', chapters: 36, testament: 'OT', order: 4 },
  { code: 'deu', name: '신명기', chapters: 34, testament: 'OT', order: 5 },
  { code: 'jos', name: '여호수아', chapters: 24, testament: 'OT', order: 6 },
  { code: 'jdg', name: '사사기', chapters: 21, testament: 'OT', order: 7 },
  { code: 'rut', name: '룻기', chapters: 4, testament: 'OT', order: 8 },
  { code: '1sa', name: '사무엘상', chapters: 31, testament: 'OT', order: 9 },
  { code: '2sa', name: '사무엘하', chapters: 24, testament: 'OT', order: 10 },
  { code: '1ki', name: '열왕기상', chapters: 22, testament: 'OT', order: 11 },
  { code: '2ki', name: '열왕기하', chapters: 25, testament: 'OT', order: 12 },
  { code: '1ch', name: '역대상', chapters: 29, testament: 'OT', order: 13 },
  { code: '2ch', name: '역대하', chapters: 36, testament: 'OT', order: 14 },
  { code: 'ezr', name: '에스라', chapters: 10, testament: 'OT', order: 15 },
  { code: 'neh', name: '느헤미야', chapters: 13, testament: 'OT', order: 16 },
  { code: 'est', name: '에스더', chapters: 10, testament: 'OT', order: 17 },
  { code: 'job', name: '욥기', chapters: 42, testament: 'OT', order: 18 },
  { code: 'psa', name: '시편', chapters: 150, testament: 'OT', order: 19 },
  { code: 'pro', name: '잠언', chapters: 31, testament: 'OT', order: 20 },
  { code: 'ecc', name: '전도서', chapters: 12, testament: 'OT', order: 21 },
  { code: 'sng', name: '아가', chapters: 8, testament: 'OT', order: 22 },
  { code: 'isa', name: '이사야', chapters: 66, testament: 'OT', order: 23 },
  { code: 'jer', name: '예레미야', chapters: 52, testament: 'OT', order: 24 },
  { code: 'lam', name: '예레미야애가', chapters: 5, testament: 'OT', order: 25 },
  { code: 'ezk', name: '에스겔', chapters: 48, testament: 'OT', order: 26 },
  { code: 'dan', name: '다니엘', chapters: 12, testament: 'OT', order: 27 },
  { code: 'hos', name: '호세아', chapters: 14, testament: 'OT', order: 28 },
  { code: 'jol', name: '요엘', chapters: 3, testament: 'OT', order: 29 },
  { code: 'amo', name: '아모스', chapters: 9, testament: 'OT', order: 30 },
  { code: 'oba', name: '오바댜', chapters: 1, testament: 'OT', order: 31 },
  { code: 'jon', name: '요나', chapters: 4, testament: 'OT', order: 32 },
  { code: 'mic', name: '미가', chapters: 7, testament: 'OT', order: 33 },
  { code: 'nah', name: '나훔', chapters: 3, testament: 'OT', order: 34 },
  { code: 'hab', name: '하박국', chapters: 3, testament: 'OT', order: 35 },
  { code: 'zep', name: '스바냐', chapters: 3, testament: 'OT', order: 36 },
  { code: 'hag', name: '학개', chapters: 2, testament: 'OT', order: 37 },
  { code: 'zec', name: '스가랴', chapters: 14, testament: 'OT', order: 38 },
  { code: 'mal', name: '말라기', chapters: 4, testament: 'OT', order: 39 },

  // ── New Testament (27 books, 260 chapters) ──
  { code: 'mat', name: '마태복음', chapters: 28, testament: 'NT', order: 40 },
  { code: 'mrk', name: '마가복음', chapters: 16, testament: 'NT', order: 41 },
  { code: 'luk', name: '누가복음', chapters: 24, testament: 'NT', order: 42 },
  { code: 'jhn', name: '요한복음', chapters: 21, testament: 'NT', order: 43 },
  { code: 'act', name: '사도행전', chapters: 28, testament: 'NT', order: 44 },
  { code: 'rom', name: '로마서', chapters: 16, testament: 'NT', order: 45 },
  { code: '1co', name: '고린도전서', chapters: 16, testament: 'NT', order: 46 },
  { code: '2co', name: '고린도후서', chapters: 13, testament: 'NT', order: 47 },
  { code: 'gal', name: '갈라디아서', chapters: 6, testament: 'NT', order: 48 },
  { code: 'eph', name: '에베소서', chapters: 6, testament: 'NT', order: 49 },
  { code: 'php', name: '빌립보서', chapters: 4, testament: 'NT', order: 50 },
  { code: 'col', name: '골로새서', chapters: 4, testament: 'NT', order: 51 },
  { code: '1th', name: '데살로니가전서', chapters: 5, testament: 'NT', order: 52 },
  { code: '2th', name: '데살로니가후서', chapters: 3, testament: 'NT', order: 53 },
  { code: '1ti', name: '디모데전서', chapters: 6, testament: 'NT', order: 54 },
  { code: '2ti', name: '디모데후서', chapters: 4, testament: 'NT', order: 55 },
  { code: 'tit', name: '디도서', chapters: 3, testament: 'NT', order: 56 },
  { code: 'phm', name: '빌레몬서', chapters: 1, testament: 'NT', order: 57 },
  { code: 'heb', name: '히브리서', chapters: 13, testament: 'NT', order: 58 },
  { code: 'jas', name: '야고보서', chapters: 5, testament: 'NT', order: 59 },
  { code: '1pe', name: '베드로전서', chapters: 5, testament: 'NT', order: 60 },
  { code: '2pe', name: '베드로후서', chapters: 3, testament: 'NT', order: 61 },
  { code: '1jn', name: '요한1서', chapters: 5, testament: 'NT', order: 62 },
  { code: '2jn', name: '요한2서', chapters: 1, testament: 'NT', order: 63 },
  { code: '3jn', name: '요한3서', chapters: 1, testament: 'NT', order: 64 },
  { code: 'jud', name: '유다서', chapters: 1, testament: 'NT', order: 65 },
  { code: 'rev', name: '요한계시록', chapters: 22, testament: 'NT', order: 66 },
];

/** Look up a single book by its code (e.g. 'gen'). */
export function getBookByCode(code: string): BibleBook | undefined {
  return bibleBooks.find((b) => b.code === code);
}

/** Return all books belonging to a testament ('OT' or 'NT'). */
export function getBooksByTestament(testament: Testament): BibleBook[] {
  return bibleBooks.filter((b) => b.testament === testament);
}
