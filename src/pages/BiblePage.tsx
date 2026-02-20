import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bibleBooks, getBookByCode } from '@/data/bibleBooks';
import BibleReader from '@/components/BibleReader';
import { ChevronLeft } from 'lucide-react';
import type { BibleBook } from '@/types/bible';

const shortNames: Record<string, string> = {
  창세기: '창', 출애굽기: '출', 레위기: '레', 민수기: '민', 신명기: '신',
  여호수아: '수', 사사기: '삿', 룻기: '룻', 사무엘상: '삼상', 사무엘하: '삼하',
  열왕기상: '왕상', 열왕기하: '왕하', 역대상: '대상', 역대하: '대하',
  에스라: '스', 느헤미야: '느', 에스더: '에', 욥기: '욥', 시편: '시',
  잠언: '잠', 전도서: '전', 아가: '아', 이사야: '사', 예레미야: '렘',
  예레미야애가: '애', 에스겔: '겔', 다니엘: '단', 호세아: '호', 요엘: '욜',
  아모스: '암', 오바댜: '옵', 요나: '욘', 미가: '미', 나훔: '나',
  하박국: '합', 스바냐: '습', 학개: '학', 스가랴: '슥', 말라기: '말',
  마태복음: '마', 마가복음: '막', 누가복음: '눅', 요한복음: '요',
  사도행전: '행', 로마서: '롬', 고린도전서: '고전', 고린도후서: '고후',
  갈라디아서: '갈', 에베소서: '엡', 빌립보서: '빌', 골로새서: '골',
  데살로니가전서: '살전', 데살로니가후서: '살후', 디모데전서: '딤전',
  디모데후서: '딤후', 디도서: '딛', 빌레몬서: '몬', 히브리서: '히',
  야고보서: '약', 베드로전서: '벧전', 베드로후서: '벧후',
  요한1서: '요일', 요한2서: '요이', 요한3서: '요삼', 유다서: '유',
  요한계시록: '계',
};

interface BookCategory {
  label: string;
  codes: string[];
}

const categories: BookCategory[] = [
  { label: '율법서', codes: ['gen', 'exo', 'lev', 'num', 'deu'] },
  { label: '역사서', codes: ['jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est'] },
  { label: '시가서', codes: ['job', 'psa', 'pro', 'ecc', 'sng'] },
  { label: '대선지서', codes: ['isa', 'jer', 'lam', 'ezk', 'dan'] },
  { label: '소선지서', codes: ['hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nah', 'hab', 'zep', 'hag', 'zec', 'mal'] },
  { label: '복음서', codes: ['mat', 'mrk', 'luk', 'jhn'] },
  { label: '역사', codes: ['act'] },
  { label: '바울서신', codes: ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm'] },
  { label: '공동서신', codes: ['heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud'] },
  { label: '예언서', codes: ['rev'] },
];

type ViewMode = 'picker' | 'reading';

export default function BiblePage() {
  const { bookCode: paramBook, chapter: paramChapter } = useParams();
  const navigate = useNavigate();

  const [selectedBookCode, setSelectedBookCode] = useState<string>(paramBook || 'gen');
  const [selectedChapter, setSelectedChapter] = useState<number>(
    paramChapter ? Number(paramChapter) : 1,
  );
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>(
    paramBook && paramChapter ? 'reading' : 'picker',
  );

  const bookListRef = useRef<HTMLDivElement>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);
  const verseListRef = useRef<HTMLDivElement>(null);
  const selectedBookRef = useRef<HTMLButtonElement>(null);
  const selectedChapterRef = useRef<HTMLButtonElement>(null);
  const selectedVerseRef = useRef<HTMLButtonElement>(null);

  const selectedBook = getBookByCode(selectedBookCode);

  // Scroll selected book into view on mount
  useEffect(() => {
    setTimeout(() => {
      selectedBookRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 50);
  }, []);

  // Scroll selected chapter into view when book changes
  useEffect(() => {
    setTimeout(() => {
      selectedChapterRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 50);
  }, [selectedBookCode]);

  // Scroll selected verse into view when chapter changes
  useEffect(() => {
    setTimeout(() => {
      selectedVerseRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 50);
  }, [selectedChapter]);

  const handleBookSelect = useCallback((code: string) => {
    setSelectedBookCode(code);
    setSelectedChapter(1);
    setSelectedVerse(1);
  }, []);

  const handleChapterSelect = useCallback((ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerse(1);
  }, []);

  const handleVerseSelect = useCallback((v: number) => {
    setSelectedVerse(v);
  }, []);

  const handleGo = () => {
    setViewMode('reading');
    navigate(`/bible/${selectedBookCode}/${selectedChapter}`, { replace: true });
  };

  const handleBack = () => {
    setViewMode('picker');
    navigate('/bible', { replace: true });
  };

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    navigate(`/bible/${selectedBookCode}/${chapter}`, { replace: true });
    window.scrollTo(0, 0);
  };

  if (viewMode === 'reading') {
    return (
      <div className="pt-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1 -ml-1 text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-text-primary">
              {selectedBook?.name} {selectedChapter}장
            </h1>
          </div>
        </div>
        <BibleReader
          bookCode={selectedBookCode}
          chapter={selectedChapter}
          startVerse={selectedVerse}
          onChapterChange={handleChapterChange}
        />
      </div>
    );
  }

  // Build categorized book list
  const bookMap = new Map<string, BibleBook>();
  bibleBooks.forEach((b) => bookMap.set(b.code, b));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-text-primary">성경</h1>
      </div>

      {/* 3-column picker */}
      <div className="flex flex-1 min-h-0 border-t border-gray-200">
        {/* Column 1: Books */}
        <div
          ref={bookListRef}
          className="w-[44%] overflow-y-auto border-r border-gray-200 bg-gray-50"
        >
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                <span className="text-[11px] font-semibold text-text-muted">{cat.label}</span>
              </div>
              {cat.codes.map((code) => {
                const b = bookMap.get(code);
                if (!b) return null;
                const isSelected = code === selectedBookCode;
                const abbr = shortNames[b.name] ?? b.name[0];

                return (
                  <button
                    key={code}
                    ref={isSelected ? selectedBookRef : undefined}
                    onClick={() => handleBookSelect(code)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 transition-colors ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-white hover:bg-gray-50 text-text-primary'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold min-w-[28px] ${
                        isSelected ? 'text-primary-200' : 'text-primary-500'
                      }`}
                    >
                      {abbr}
                    </span>
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : ''}`}>
                      {b.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Column 2: Chapters */}
        <div
          ref={chapterListRef}
          className="w-[28%] overflow-y-auto border-r border-gray-200 bg-white"
        >
          {selectedBook &&
            Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => {
              const isSelected = ch === selectedChapter;
              return (
                <button
                  key={ch}
                  ref={isSelected ? selectedChapterRef : undefined}
                  onClick={() => handleChapterSelect(ch)}
                  className={`w-full py-3 text-center text-sm font-medium border-b border-gray-50 transition-colors ${
                    isSelected
                      ? 'bg-primary-50 text-primary-600 font-bold'
                      : 'text-text-primary hover:bg-gray-50'
                  }`}
                >
                  {ch} 장
                </button>
              );
            })}
        </div>

        {/* Column 3: Verses */}
        <div
          ref={verseListRef}
          className="w-[28%] overflow-y-auto bg-white"
        >
          {Array.from({ length: 176 }, (_, i) => i + 1).map((v) => {
            const isSelected = v === selectedVerse;
            return (
              <button
                key={v}
                ref={isSelected ? selectedVerseRef : undefined}
                onClick={() => handleVerseSelect(v)}
                className={`w-full py-3 text-center text-sm font-medium border-b border-gray-50 transition-colors ${
                  isSelected
                    ? 'bg-primary-50 text-primary-600 font-bold'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                {v} 절
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom selection bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 pb-safe">
        <button
          onClick={handleGo}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm"
        >
          {selectedBook?.name} {selectedChapter}장 {selectedVerse}절 읽기
        </button>
      </div>
    </div>
  );
}
