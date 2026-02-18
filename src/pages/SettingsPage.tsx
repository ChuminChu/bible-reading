import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBibleVersion } from '@/contexts/BibleVersionContext';
import * as progressService from '@/services/progressService';
import { BIBLE_VERSIONS, DEFAULT_FONT_SIZE } from '@/lib/constants';
import { LogOut, Type, BookText, RotateCcw, User, Shield, ChevronRight } from 'lucide-react';
import type { BibleVersion } from '@/types/bible';

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { version, setVersion } = useBibleVersion();
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    progressService.getUserPreferences(user.id).then((prefs) => {
      if (prefs) {
        setFontSize(prefs.fontSize);
      }
    });
  }, [user]);

  const handleFontSizeChange = async (newSize: number) => {
    setFontSize(newSize);
    if (user) {
      await progressService.updateUserPreferences(user.id, { fontSize: newSize });
    }
  };

  const handleVersionChange = async (newVersion: BibleVersion) => {
    setVersion(newVersion);
    if (user) {
      await progressService.updateUserPreferences(user.id, { bibleVersion: newVersion });
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    try {
      await progressService.resetProgress(user.id);
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-text-primary mb-6">설정</h1>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={20} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {profile?.displayName ?? user?.email}
            </p>
            <p className="text-xs text-text-muted">로그인됨</p>
          </div>
        </div>
      </div>

      {/* Bible Version */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <BookText size={18} className="text-primary-500" />
          <span className="text-sm font-medium text-text-primary">성경 버전</span>
        </div>
        <div className="flex gap-2">
          {(Object.entries(BIBLE_VERSIONS) as [BibleVersion, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleVersionChange(key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                version === key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Type size={18} className="text-primary-500" />
          <span className="text-sm font-medium text-text-primary">글꼴 크기</span>
          <span className="text-xs text-text-muted ml-auto">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={14}
          max={28}
          value={fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted">작게</span>
          <span className="text-xs text-text-muted">크게</span>
        </div>
        <p className="mt-3 text-text-primary" style={{ fontSize: `${fontSize}px` }}>
          태초에 하나님이 천지를 창조하시니라
        </p>
      </div>

      {/* Admin link (admin only) */}
      {profile?.role === 'admin' && (
        <button
          onClick={() => navigate('/admin')}
          className="w-full bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-3"
        >
          <Shield size={18} className="text-primary-500" />
          <span className="text-sm font-medium text-text-primary flex-1 text-left">관리자</span>
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      )}

      {/* Reset */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-3 w-full text-left"
        >
          <RotateCcw size={18} className="text-red-400" />
          <span className="text-sm font-medium text-red-500">진행률 초기화</span>
        </button>

        {showResetConfirm && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl">
            <p className="text-sm text-red-600 mb-3">
              모든 통독 진행 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-sm font-medium bg-white rounded-lg border border-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                {resetting ? '초기화 중...' : '확인'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <LogOut size={16} />
        로그아웃
      </button>

      <p className="text-center text-xs text-text-muted mt-6 pb-4">동행300일 v1.0</p>
    </div>
  );
}
