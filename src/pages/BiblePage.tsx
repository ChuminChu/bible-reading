import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bibleBooks, getBooksByTestament, getBookByCode } from '@/data/bibleBooks';
import BibleReader from '@/components/BibleReader';
import { ChevronLeft, Search } from 'lucide-react';
import type { Testament } from '@/types/bible';

type ViewMode = 'books' | 'chapters' | 'reading';

export default function BiblePage() {
  const { bookCode: paramBook, chapter: paramChapter } = useParams();
  const navigate = useNavigate();

  const [selectedBook, setSelectedBook] = useState<string>(paramBook || '');
  const [selectedChapter, setSelectedChapter] = useState<number>(
    paramChapter ? Number(paramChapter) : 0,
  );
  const [testament, setTestament] = useState<Testament>('OT');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine view mode
  const viewMode: ViewMode = selectedBook && selectedChapter
    ? 'reading'
    : selectedBook
      ? 'chapters'
      : 'books';

  // Initialize from URL params
  if (paramBook && paramBook !== selectedBook) {
    setSelectedBook(paramBook);
    if (paramChapter) setSelectedChapter(Number(paramChapter));
  }

  const handleBookSelect = (code: string) => {
    setSelectedBook(code);
    setSelectedChapter(0);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    navigate(`/bible/${selectedBook}/${chapter}`, { replace: true });
  };

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    navigate(`/bible/${selectedBook}/${chapter}`, { replace: true });
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (viewMode === 'reading') {
      setSelectedChapter(0);
      navigate('/bible', { replace: true });
    } else if (viewMode === 'chapters') {
      setSelectedBook('');
    }
  };

  const book = getBookByCode(selectedBook);
  const filteredBooks = searchQuery
    ? bibleBooks.filter((b) => b.name.includes(searchQuery))
    : getBooksByTestament(testament);

  return (
    <div className="pt-4">
      {/* Header */}
      <div className="px-4 mb-4">
        {viewMode === 'books' ? (
          <h1 className="text-xl font-bold text-text-primary">성경</h1>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1 -ml-1 text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-text-primary">
              {book?.name}
              {viewMode === 'reading' && ` ${selectedChapter}장`}
            </h1>
          </div>
        )}
      </div>

      {/* Book selector */}
      {viewMode === 'books' && (
        <>
          {/* Search */}
          <div className="px-4 mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="성경 검색..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Testament toggle */}
          {!searchQuery && (
            <div className="flex gap-2 px-4 mb-4">
              <button
                onClick={() => setTestament('OT')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  testament === 'OT'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                구약 (39권)
              </button>
              <button
                onClick={() => setTestament('NT')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  testament === 'NT'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                신약 (27권)
              </button>
            </div>
          )}

          {/* Book grid */}
          <div className="px-4 grid grid-cols-3 gap-2 pb-4">
            {filteredBooks.map((b) => (
              <button
                key={b.code}
                onClick={() => handleBookSelect(b.code)}
                className="text-left p-3 rounded-xl bg-white border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <p className="text-sm font-medium text-text-primary truncate">{b.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{b.chapters}장</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Chapter selector */}
      {viewMode === 'chapters' && book && (
        <div className="px-4">
          <p className="text-sm text-text-secondary mb-3">장을 선택하세요</p>
          <div className="grid grid-cols-5 gap-2 pb-4">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
              <button
                key={ch}
                onClick={() => handleChapterSelect(ch)}
                className="py-3 rounded-xl bg-white border border-gray-100 text-sm font-medium text-text-primary hover:bg-primary-50 hover:border-primary-300 transition-colors"
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reader */}
      {viewMode === 'reading' && (
        <BibleReader
          bookCode={selectedBook}
          chapter={selectedChapter}
          onChapterChange={handleChapterChange}
        />
      )}
    </div>
  );
}
