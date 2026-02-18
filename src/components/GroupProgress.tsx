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

  const todayCompletedCount = members.filter((m) => m.todayCompleted).length;
  const todayReadingCount = members.filter((m) => !m.todayCompleted).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-primary-500" />
        <span className="text-sm font-semibold text-text-primary">통독 모임</span>
        <span className="text-xs text-text-muted">({members.length}명)</span>
      </div>

      {/* 오늘 현황 */}
      {todayDayNumber && (
        <div className="bg-primary-50 rounded-xl px-4 py-2.5 mb-3 text-center">
          <p className="text-sm text-primary-700 font-medium">
            오늘 {todayCompletedCount}명 통독완료
            {todayReadingCount > 0 && `, ${todayReadingCount}명 읽는 중`}
          </p>
        </div>
      )}

      {/* 멤버 리스트 */}
      <div className="space-y-2">
        {members
          .sort((a, b) => b.completedDays - a.completedDays)
          .map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 py-1.5"
            >
              {/* 아바타 */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  member.todayCompleted
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-text-muted'
                }`}
              >
                {member.displayName.charAt(0)}
              </div>

              {/* 이름 + 진행률 */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text-primary truncate block">
                  {member.displayName}
                </span>
                <p className="text-xs text-text-muted">{member.completedDays}일 완료</p>
              </div>

              {/* 오늘 완료 체크 */}
              {member.todayCompleted && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
