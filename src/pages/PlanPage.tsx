import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { readingPlan } from '@/data/readingPlan';
import { getDayNumber, getDateForDay } from '@/lib/dayCalculation';
import { TOTAL_READING_DAYS, DAYS_PER_WEEK } from '@/lib/constants';
import DayCard from '@/components/DayCard';
import ProgressRing from '@/components/ProgressRing';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WeekSection {
  weekNumber: number;
  weekLabel: string;
  days: typeof readingPlan;
}

function groupByWeek(plans: typeof readingPlan): WeekSection[] {
  const weeks: WeekSection[] = [];
  let currentWeek = -1;

  for (const plan of plans) {
    const weekIdx = Math.floor((plan.dayNumber - 1) / DAYS_PER_WEEK);

    if (weekIdx !== currentWeek) {
      currentWeek = weekIdx;
      const weekStart = getDateForDay(weekIdx * DAYS_PER_WEEK + 1);
      weeks.push({
        weekNumber: weekIdx + 1,
        weekLabel: `${weekIdx + 1}주차 (${format(weekStart, 'M/d', { locale: ko })}~)`,
        days: [],
      });
    }

    weeks[weeks.length - 1].days.push(plan);
  }

  return weeks;
}

export default function PlanPage() {
  const navigate = useNavigate();
  const { completedCount, overallProgress, isDayCompleted, toggleDay } = useReadingProgress();
  const todayDayNumber = getDayNumber(new Date());

  const weeks = groupByWeek(readingPlan);
  const currentWeekIdx = todayDayNumber
    ? Math.floor((todayDayNumber - 1) / DAYS_PER_WEEK)
    : 0;

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => {
    return new Set([currentWeekIdx]);
  });

  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to today's reading on mount
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  const toggleWeek = (weekIdx: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIdx)) {
        next.delete(weekIdx);
      } else {
        next.add(weekIdx);
      }
      return next;
    });
  };

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">통독 계획</h1>
        <div className="flex items-center gap-2">
          <ProgressRing progress={overallProgress} size={40} strokeWidth={4}>
            <span className="text-[10px] font-bold text-primary-600">{overallProgress}%</span>
          </ProgressRing>
          <span className="text-sm text-text-secondary">
            {completedCount}/{TOTAL_READING_DAYS}
          </span>
        </div>
      </div>

      {/* Week list */}
      <div className="space-y-3 pb-4">
        {weeks.map((week, idx) => {
          const isExpanded = expandedWeeks.has(idx);
          const weekCompleted = week.days.filter((d) => isDayCompleted(d.dayNumber)).length;
          const weekTotal = week.days.length;

          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleWeek(idx)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {week.weekLabel}
                  </span>
                  {weekCompleted === weekTotal && weekTotal > 0 && (
                    <span className="text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded font-medium">
                      완료
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {weekCompleted}/{weekTotal}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {week.days.map((plan) => {
                    const isToday = todayDayNumber === plan.dayNumber;
                    return (
                      <div key={plan.dayNumber} ref={isToday ? todayRef : undefined}>
                        <DayCard
                          plan={plan}
                          completed={isDayCompleted(plan.dayNumber)}
                          isToday={isToday}
                          onToggle={() => toggleDay(plan.dayNumber)}
                          onReadClick={() => navigate(`/read/${plan.dayNumber}`)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
