import { supabase } from '@/services/supabase';

export interface MemberProgress {
  userId: string;
  displayName: string;
  completedDays: number;
  todayCompleted: boolean;
}

export async function getAllMemberProgress(
  todayDayNumber: number | null,
): Promise<MemberProgress[]> {
  // 모든 프로필 조회
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, display_name');

  if (profErr) throw profErr;
  if (!profiles || profiles.length === 0) return [];

  // 모든 완료된 진행률 조회
  const { data: allProgress, error: progErr } = await supabase
    .from('reading_progress')
    .select('user_id, day_number')
    .eq('completed', true);

  if (progErr) throw progErr;

  // 사용자별 진행률 집계
  const progressMap = new Map<string, { count: number; todayDone: boolean }>();
  for (const row of allProgress ?? []) {
    const entry = progressMap.get(row.user_id) ?? { count: 0, todayDone: false };
    entry.count++;
    if (todayDayNumber && row.day_number === todayDayNumber) {
      entry.todayDone = true;
    }
    progressMap.set(row.user_id, entry);
  }

  return profiles.map((p) => {
    const prog = progressMap.get(p.id) ?? { count: 0, todayDone: false };
    return {
      userId: p.id,
      displayName: p.display_name ?? '이름없음',
      completedDays: prog.count,
      todayCompleted: prog.todayDone,
    };
  });
}
