import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDayNumber } from '@/lib/dayCalculation';
import { getAllMemberProgress } from '@/services/communityService';
import type { MemberProgress } from '@/services/communityService';
import { Users, Check } from 'lucide-react';

export default function GroupProgress() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const todayDayNumber = getDayNumber(new Date());

  useEffect(() => {
    if (!user) return;
    getAllMemberProgress(todayDayNumber)
      .then(setMembers)
      .catch((err) => console.error('Failed to load progress:', err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;
  if (members.length === 0) return null;

  const sorted = [...members].sort((a, b) => b.completedDays - a.completedDays);
  const todayCompletedCount = members.filter((m) => m.todayCompleted).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-primary-500" />
        <span className="text-sm font-semibold text-text-primary">통독 모임</span>
        <span className="text-xs text-text-muted">({members.length}명)</span>
        {todayDayNumber && (
          <span className="ml-auto text-xs font-medium text-primary-600">
            오늘 {todayCompletedCount}명 완료
          </span>
        )}
      </div>

      {/* 가로 스크롤 멤버 리스트 */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {sorted.map((member) => (
          <div
            key={member.userId}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14"
          >
            {/* 아바타 */}
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                  member.todayCompleted
                    ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-400'
                    : 'bg-gray-100 text-text-muted'
                }`}
              >
                {member.displayName.charAt(0)}
              </div>
              {member.todayCompleted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary-500 flex items-center justify-center ring-2 ring-white">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* 이름 */}
            <span className="text-[11px] font-medium text-text-primary truncate w-full text-center">
              {member.displayName}
            </span>
            <span className="text-[10px] text-text-muted -mt-1">
              {member.completedDays}일
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
