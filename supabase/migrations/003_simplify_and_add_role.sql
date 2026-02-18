-- 003: 그룹 기반 → 전체 공개 + 관리자 역할

-- 1. profiles에 role 컬럼 추가
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

-- 2. 기존 그룹 기반 RLS 정책 제거
DROP POLICY IF EXISTS "Group members can view profiles" ON profiles;
DROP POLICY IF EXISTS "Group members can view each others progress" ON reading_progress;

-- 3. 모든 인증 사용자가 profiles 조회 가능
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4. 모든 인증 사용자가 reading_progress 조회 가능
CREATE POLICY "Authenticated users can view all reading progress"
  ON reading_progress FOR SELECT
  USING (auth.uid() IS NOT NULL);
