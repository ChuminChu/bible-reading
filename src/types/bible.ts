export type Testament = 'OT' | 'NT';

export interface BibleBook {
  code: string;
  name: string;
  chapters: number;
  testament: Testament;
  order: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: Record<string, string>;
}

export type BibleVersion = 'krv' | 'nkrv';
