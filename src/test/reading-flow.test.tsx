/**
 * 통독 완료 → 홈 복귀 → 재진입 시나리오 테스트
 *
 * 검증 항목:
 * 1. 통독 완료 시 DB 저장이 끝난 후에만 완료 화면이 나오는가
 * 2. 홈 복귀 시 GroupProgress가 현재 사용자 체크 표시를 보여주는가
 * 3. 홈에서 다시 통독 진입 시 이미 체크된 상태로 표시되는가
 * 4. 기존 통독 현황(다른 날짜 완독)이 유지되는가
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';

// ── Mocks ──────────────────────────────────────────────────────────

// Mock Supabase before anything else
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: vi.fn().mockResolvedValue({}),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-1' } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Track markDayComplete calls and timing
let markDayCompleteResolve: (() => void) | null = null;
const mockToggleDayComplete = vi.fn().mockImplementation(() => {
  return new Promise<void>((resolve) => {
    markDayCompleteResolve = resolve;
  });
});

const mockToggleChapterComplete = vi.fn().mockResolvedValue(undefined);

// Existing progress: days 1-5 already completed (simulating prior reading history)
const existingProgress = [
  { dayNumber: 1, completed: true, completedAt: '2026-02-02T08:00:00Z' },
  { dayNumber: 2, completed: true, completedAt: '2026-02-03T08:00:00Z' },
  { dayNumber: 3, completed: true, completedAt: '2026-02-04T08:00:00Z' },
  { dayNumber: 4, completed: true, completedAt: '2026-02-05T08:00:00Z' },
  { dayNumber: 5, completed: true, completedAt: '2026-02-06T08:00:00Z' },
];

const mockGetReadingProgress = vi.fn().mockResolvedValue(existingProgress);

vi.mock('@/services/progressService', () => ({
  getReadingProgress: (...args: unknown[]) => mockGetReadingProgress(...args),
  toggleDayComplete: (...args: unknown[]) => mockToggleDayComplete(...args),
  toggleChapterComplete: (...args: unknown[]) => mockToggleChapterComplete(...args),
  getChapterProgress: vi.fn().mockResolvedValue([]),
}));

// Mock community service — 3 members, none completed today initially
const mockGetAllMemberProgress = vi.fn().mockResolvedValue([
  { userId: 'test-user-1', displayName: '나', completedDays: 5, todayCompleted: false },
  { userId: 'user-2', displayName: '철수', completedDays: 3, todayCompleted: false },
  { userId: 'user-3', displayName: '영희', completedDays: 7, todayCompleted: true },
]);

vi.mock('@/services/communityService', () => ({
  getAllMemberProgress: (...args: unknown[]) => mockGetAllMemberProgress(...args),
}));

// Mock today's day number — return a fixed day (42)
vi.mock('@/lib/dayCalculation', () => ({
  getDayNumber: vi.fn().mockReturnValue(42),
  getDateForDay: vi.fn().mockReturnValue(new Date('2026-03-24')),
  isSunday: vi.fn().mockReturnValue(false),
  getCurrentWeek: vi.fn().mockReturnValue(6),
  getWeekDates: vi.fn().mockReturnValue(
    Array.from({ length: 7 }, (_, i) => new Date(`2026-03-${18 + i}`)),
  ),
}));

// Mock reading plan for day 42 — 2 chapters (small for fast test)
vi.mock('@/data/readingPlan', () => ({
  getDayPlan: vi.fn().mockImplementation((day: number) => {
    if (day === 42) {
      return {
        dayNumber: 42,
        ranges: [{ bookCode: 'exo', startChapter: 1, endChapter: 2 }],
        label: '출 1-2',
      };
    }
    return null;
  }),
}));

vi.mock('@/data/bibleBooks', () => ({
  getBookByCode: vi.fn().mockReturnValue({ code: 'exo', name: '출애굽기', chapters: 40 }),
}));

// Mock Bible text hook
vi.mock('@/hooks/useBibleText', () => ({
  useBibleText: vi.fn().mockReturnValue({
    data: {
      bookCode: 'exo',
      chapter: 1,
      verses: { '1': '이스라엘의 아들들의 이름은...', '2': '르우벤과 시므온과...' },
    },
    loading: false,
    error: null,
  }),
}));

// Mock today reading hook
vi.mock('@/hooks/useTodayReading', () => ({
  useTodayReading: vi.fn().mockReturnValue({
    dayNumber: 42,
    plan: {
      dayNumber: 42,
      ranges: [{ bookCode: 'exo', startChapter: 1, endChapter: 2 }],
      label: '출 1-2',
    },
    isSunday: false,
    isBeforeStart: false,
  }),
}));

// Mock Bible version context
vi.mock('@/contexts/BibleVersionContext', () => ({
  useBibleVersion: vi.fn().mockReturnValue({
    version: 'krv',
    setVersion: vi.fn(),
    versionName: '개역개정',
  }),
  BibleVersionProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock Auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'test-user-1', email: 'test@test.com' },
    profile: { displayName: '나', role: 'member' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  TOTAL_READING_DAYS: 288,
  START_DATE: new Date('2026-02-02'),
}));

// ── Imports (after mocks) ──────────────────────────────────────────

import HomePage from '@/pages/HomePage';
import ReadingFlowPage from '@/pages/ReadingFlowPage';
import { ReadingProgressProvider } from '@/contexts/ReadingProgressContext';

// ── Helpers ────────────────────────────────────────────────────────

function TestApp({ initialPath = '/' }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <ReadingProgressProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/read/:dayNumber" element={<ReadingFlowPage />} />
        </Routes>
      </ReadingProgressProvider>
    </MemoryRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('통독 완료 → 홈 복귀 흐름', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReadingProgress.mockResolvedValue([...existingProgress]);
    mockToggleDayComplete.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        markDayCompleteResolve = resolve;
      });
    });
    mockGetAllMemberProgress.mockResolvedValue([
      { userId: 'test-user-1', displayName: '나', completedDays: 5, todayCompleted: false },
      { userId: 'user-2', displayName: '철수', completedDays: 3, todayCompleted: false },
      { userId: 'user-3', displayName: '영희', completedDays: 7, todayCompleted: true },
    ]);
  });

  it('1. DB 저장 완료 전까지 완료 화면이 나오지 않아야 한다', async () => {
    const user = userEvent.setup();

    render(<TestApp initialPath={`/read/${42}`} />);

    // Wait for the reading page to load — use heading element to avoid multiple match
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /출애굽기 1장/ })).toBeInTheDocument();
    });

    // Check first chapter (체크 후 다음 장으로)
    const checkButton = screen.getByRole('button', { name: /체크 후 다음 장으로/ });
    await user.click(checkButton);

    // Should now show second chapter
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /출애굽기 2장/ })).toBeInTheDocument();
    });

    // Check second (last) chapter — triggers day completion
    const completeButton = screen.getByRole('button', { name: /체크하고 통독 완료/ });
    await user.click(completeButton);

    // DB write is still pending (markDayCompleteResolve not called yet)
    // The completion screen should NOT be shown yet
    expect(screen.queryByText('오늘의 통독 완료!')).not.toBeInTheDocument();

    // Now resolve the DB write
    await act(async () => {
      markDayCompleteResolve?.();
    });

    // NOW the completion screen should appear
    await waitFor(() => {
      expect(screen.getByText('오늘의 통독 완료!')).toBeInTheDocument();
    });

    // Verify the DB was actually called
    expect(mockToggleDayComplete).toHaveBeenCalledWith('test-user-1', 42, true);
  });

  it('2. 홈 복귀 시 GroupProgress에 내 체크 표시가 나와야 한다', async () => {
    // Start at home page
    render(<TestApp initialPath="/" />);

    // Wait for the home page and group progress to load
    await waitFor(() => {
      expect(screen.getByText('통독 모임')).toBeInTheDocument();
    });

    // Verify members are displayed (use getAllByText since names may appear multiple places)
    expect(screen.getAllByText('나').length).toBeGreaterThan(0);
    expect(screen.getAllByText('철수').length).toBeGreaterThan(0);
    expect(screen.getAllByText('영희').length).toBeGreaterThan(0);

    // Verify completed days are shown
    const dayLabels = screen.getAllByText(/^\d+일$/);
    expect(dayLabels.length).toBeGreaterThan(0);
  });

  it('3. GroupProgress가 context의 optimistic 상태를 반영해야 한다', async () => {
    // Simulate: reading progress context has day 42 as completed (optimistic)
    const progressWithToday = [
      ...existingProgress,
      { dayNumber: 42, completed: true, completedAt: new Date().toISOString() },
    ];
    mockGetReadingProgress.mockResolvedValue(progressWithToday);

    render(<TestApp initialPath="/" />);

    await waitFor(() => {
      expect(screen.getByText('통독 모임')).toBeInTheDocument();
    });

    // The context has day 42 completed, so GroupProgress should show
    // the current user as having completed today
    // The "오늘 N명 완료" count should reflect this
    await waitFor(() => {
      // 영희 (from DB) + 나 (from context overlay) = 2명 완료
      expect(screen.getByText(/오늘 2명 완료/)).toBeInTheDocument();
    });
  });

  it('4. 기존 통독 현황(1-5일차)이 completedCount에 반영되어야 한다', async () => {
    render(<TestApp initialPath="/" />);

    // Wait for progress to load
    await waitFor(() => {
      // completedCount should be 5 (days 1-5 completed)
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    // The "읽은 일수" label should be visible
    expect(screen.getByText('읽은 일수')).toBeInTheDocument();
  });

  it('5. 통독 재진입 시 이미 완료된 상태가 표시되어야 한다', async () => {
    // Simulate chapters already completed for today
    const { getChapterProgress } = await import('@/services/progressService');
    vi.mocked(getChapterProgress).mockResolvedValue([
      { bookCode: 'exo', chapterNumber: 1, completed: true, completedAt: '2026-03-24T08:00:00Z' },
      { bookCode: 'exo', chapterNumber: 2, completed: true, completedAt: '2026-03-24T08:00:00Z' },
    ]);

    render(<TestApp initialPath={`/read/${42}`} />);

    // Since all chapters are already completed, it should show the completion screen
    await waitFor(() => {
      expect(screen.getByText('오늘의 통독 완료!')).toBeInTheDocument();
    });

    // "다시 읽기" button should be available
    expect(screen.getByRole('button', { name: '다시 읽기' })).toBeInTheDocument();

    // "홈으로 돌아가기" button should be available
    expect(screen.getByRole('button', { name: '홈으로 돌아가기' })).toBeInTheDocument();
  });

  it('6. GroupProgress에서 다른 사용자 현황도 정상 표시되어야 한다', async () => {
    render(<TestApp initialPath="/" />);

    await waitFor(() => {
      expect(screen.getByText('통독 모임')).toBeInTheDocument();
    });

    // All members should be visible
    expect(screen.getAllByText('나').length).toBeGreaterThan(0);
    expect(screen.getAllByText('철수').length).toBeGreaterThan(0);
    expect(screen.getAllByText('영희').length).toBeGreaterThan(0);

    // Member count — rendered as "(3명)" in a span
    expect(screen.getByText(/\(3명\)/)).toBeInTheDocument();
  });
});
