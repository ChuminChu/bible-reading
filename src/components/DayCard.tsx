import { Check, BookOpen } from 'lucide-react';
import type { DayPlan } from '@/types/plan';
import { getDateForDay } from '@/lib/dayCalculation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DayCardProps {
  plan: DayPlan;
  completed: boolean;
  isToday: boolean;
  onToggle: () => void;
  onReadClick?: () => void;
}

export default function DayCard({ plan, completed, isToday, onToggle, onReadClick }: DayCardProps) {
  const date = getDateForDay(plan.dayNumber);
  const dateStr = format(date, 'M/d (E)', { locale: ko });

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isToday
          ? 'bg-primary-50 border border-primary-200'
          : completed
            ? 'bg-gray-50'
            : 'bg-white border border-gray-100'
      }`}
    >
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
          completed
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'border-gray-300 hover:border-primary-400'
        }`}
        aria-label={completed ? '완료 취소' : '완료 표시'}
      >
        {completed && <Check size={16} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            Day {plan.dayNumber}
          </span>
          <span className="text-xs text-text-muted">{dateStr}</span>
          {isToday && (
            <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
              오늘
            </span>
          )}
        </div>
        <p className={`text-sm mt-0.5 ${completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
          {plan.label}
        </p>
      </div>

      {onReadClick && (
        <button
          onClick={onReadClick}
          className="flex-shrink-0 p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
          aria-label="읽기"
        >
          <BookOpen size={18} />
        </button>
      )}
    </div>
  );
}
