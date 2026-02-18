import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, sendPasswordReset } from '@/services/adminService';
import type { UserInfo } from '@/services/adminService';
import { ArrowLeft, KeyRound, Shield } from 'lucide-react';

export default function AdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  }, [profile, navigate]);

  const handlePasswordReset = async (user: UserInfo) => {
    if (!user.email) return;
    setResetStatus((prev) => ({ ...prev, [user.id]: 'sending' }));
    try {
      await sendPasswordReset(user.email);
      setResetStatus((prev) => ({ ...prev, [user.id]: 'sent' }));
    } catch {
      setResetStatus((prev) => ({ ...prev, [user.id]: 'error' }));
    }
  };

  if (profile?.role !== 'admin') return null;

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-1">
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">관리자</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3">
                {/* 아바타 */}
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                  {u.displayName.charAt(0) || '?'}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {u.displayName || '이름없음'}
                    </span>
                    {u.role === 'admin' && (
                      <Shield size={12} className="text-primary-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{u.email}</p>
                </div>

                {/* 비밀번호 초기화 */}
                <button
                  onClick={() => handlePasswordReset(u)}
                  disabled={resetStatus[u.id] === 'sending' || resetStatus[u.id] === 'sent'}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <KeyRound size={12} />
                  {resetStatus[u.id] === 'sending'
                    ? '전송중...'
                    : resetStatus[u.id] === 'sent'
                      ? '전송됨'
                      : resetStatus[u.id] === 'error'
                        ? '실패'
                        : '비밀번호 초기화'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-muted mt-8">
        사용자 삭제는 Supabase 대시보드에서 가능합니다.
      </p>
    </div>
  );
}
