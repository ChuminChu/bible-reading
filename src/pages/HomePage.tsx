import { useNavigate } from 'react-router-dom';
import { useTodayReading } from '@/hooks/useTodayReading';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import ProgressRing from '@/components/ProgressRing';
import { getBookByCode } from '@/data/bibleBooks';
import { TOTAL_READING_DAYS } from '@/lib/constants';
import { BookOpen, Sprout, CheckCircle2 } from 'lucide-react';
import type { ReadingRange } from '@/types/plan';
import GroupProgress from '@/components/GroupProgress';

function getShortLabel(range: ReadingRange): string {
  const book = getBookByCode(range.bookCode);
  const name = book?.name ?? range.bookCode;
  if (range.startChapter === range.endChapter) return `${name}${range.startChapter}장`;
  return `${name}${range.startChapter}-${range.endChapter}장`;
}

function getFirstChapterLabel(ranges: ReadingRange[]): string {
  if (!ranges.length) return '';
  const book = getBookByCode(ranges[0].bookCode);
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
  const short = book ? (shortNames[book.name] ?? book.name) : '';
  return `${short}${ranges[0].startChapter}`;
}

const quotes = [
  { text: '성경 통독에서\n가장 큰 유익을 얻고 싶다면,\n읽은 것에 관해 이야기를 해보세요.', label: '복사하기' },
  { text: '감사는 훈련이다.\n수많은 연단을 거치고\n수많은 아픔을 거치고\n넘어지고 깨지면서\n습득되는 것이 감사이다.', label: '복사하기' },
  { text: '오늘도 말씀과 함께\n하루를 시작합니다.\n하나님의 말씀은\n우리 발에 등이요,\n앞길에 빛이라.', label: '복사하기' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { dayNumber, plan, isSunday, isBeforeStart } = useTodayReading();
  const { completedCount, overallProgress, isDayCompleted } = useReadingProgress();

  const todayCompleted = dayNumber ? isDayCompleted(dayNumber) : false;


  const quote = quotes[Math.floor(new Date().getDate() % quotes.length)];

  // Reading content info
  const readingLabel = plan
    ? `본문 : ${plan.ranges.map(getShortLabel).join(', ')}`
    : '';
  const buttonLabel = plan && dayNumber
    ? `${dayNumber}일차(${getFirstChapterLabel(plan.ranges)}) 읽기`
    : '';

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="bg-primary-500 text-white px-5 pt-8 pb-6 rounded-b-3xl">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Sprout size={20} />
          충교 청년초원 300일 성경통독
        </h1>
      </div>

      {/* Progress summary cards */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-xs text-text-muted mb-1">진행중</p>
              <p className="text-2xl font-bold text-text-primary">{dayNumber ?? '-'}</p>
              <p className="text-[10px] text-text-muted">{TOTAL_READING_DAYS}일</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <ProgressRing progress={overallProgress} size={56} strokeWidth={5}>
                <span className="text-xs font-bold text-primary-600">{overallProgress}%</span>
              </ProgressRing>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <p className="text-xs text-text-muted mb-1">완독</p>
              <p className="text-2xl font-bold text-text-primary">{completedCount}</p>
              <p className="text-[10px] text-text-muted">읽은 일수</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote card */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {quote.text}
          </p>
        </div>
      </div>

      {/* Group Progress */}
      <div className="px-4 mt-4">
        <GroupProgress />
      </div>

      {/* Today's reading card */}
      <div className="px-4 mt-4 mb-6">
        {isSunday ? (
          <div className="bg-accent-50 rounded-2xl border border-accent-200 p-6 text-center">
            <Sprout size={36} className="text-accent-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-accent-700 mb-1">안식일</h2>
            <p className="text-sm text-accent-600">오늘은 주일입니다. 쉬며 은혜를 누리세요.</p>
          </div>
        ) : isBeforeStart ? (
          <div className="bg-primary-50 rounded-2xl border border-primary-200 p-6 text-center">
            <p className="text-sm text-primary-700 font-medium">
              통독 시작일은 2026년 2월 2일입니다.
            </p>
          </div>
        ) : todayCompleted && dayNumber ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={24} className="text-primary-500" />
              <h2 className="text-lg font-bold text-text-primary">오늘의 통독 완료!</h2>
            </div>
            <p className="text-sm text-text-secondary mb-1">{readingLabel}</p>
            <p className="text-xs text-text-muted mb-4">Day {dayNumber} 완료</p>
            <button
              onClick={() => navigate(`/read/${dayNumber}`)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-primary-300 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors text-sm"
            >
              <BookOpen size={18} />
              다시 읽기
            </button>
          </div>
        ) : plan && dayNumber ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-text-primary mb-2">오늘의 통독</h2>
            <p className="text-sm text-text-secondary mb-1">{readingLabel}</p>
            <p className="text-sm text-text-secondary mb-4">역본 : 개역개정</p>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/read/${dayNumber}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                <BookOpen size={18} />
                {buttonLabel}
              </button>
              <button
                onClick={() => navigate('/plan')}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
              >
                목록
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-5 text-center">
            <p className="text-sm text-text-secondary">통독 일정을 확인할 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
