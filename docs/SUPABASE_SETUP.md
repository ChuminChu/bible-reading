# Supabase 설정 가이드

이 문서는 `bible-reading` 프로젝트의 Supabase 백엔드(인증 + 데이터베이스)를 처음부터 설정하는 방법을 안내합니다.

---

## 1. 프로젝트 생성

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) 에 접속하고 로그인합니다.
2. **"New Project"** 버튼을 클릭합니다.
3. **Organization**을 선택합니다. 없으면 "New Organization"으로 먼저 생성합니다.
4. 아래와 같이 입력합니다:
   - **Project name**: `bible-reading`
   - **Database Password**: 안전한 비밀번호를 설정합니다.
   - **Region**: `Northeast Asia (Seoul)` 권장
5. **"Create new project"** 를 클릭합니다.

> **참고**: 프로젝트 생성에 2~3분 정도 소요됩니다. 대시보드에 "Setting up project..." 메시지가 표시되며, 완료되면 자동으로 프로젝트 홈으로 이동합니다.

> **주의**: Database Password는 직접 사용할 일은 거의 없지만, 분실하면 재설정이 번거로우므로 안전한 곳에 기록해 두세요.

---

## 2. 데이터베이스 스키마 설정

프로젝트 생성이 완료되면 데이터베이스 테이블을 만들어야 합니다.

1. 왼쪽 사이드바에서 **SQL Editor** (원통 모양 아이콘)를 클릭합니다.
2. **"New query"** 버튼을 클릭합니다.
3. 아래 SQL 전체를 복사하여 에디터에 붙여넣습니다:

```sql
-- Reading progress (day-level tracking)
CREATE TABLE reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 288),
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, day_number)
);

-- Chapter-level progress
CREATE TABLE chapter_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_code TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_code, chapter_number)
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bible_version TEXT DEFAULT 'krv' NOT NULL,
  start_date DATE DEFAULT '2026-02-02' NOT NULL,
  font_size INTEGER DEFAULT 18 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own chapter progress"
  ON chapter_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_chapter_progress_user ON chapter_progress(user_id);
```

4. 우측 하단의 **"Run"** 버튼 (또는 `Cmd+Enter`)을 클릭합니다.
5. "Success. No rows returned" 메시지가 나오면 정상입니다.

### 테이블 생성 확인

1. 왼쪽 사이드바에서 **Table Editor** (표 모양 아이콘)를 클릭합니다.
2. 아래 3개 테이블이 표시되는지 확인합니다:
   - `reading_progress`
   - `chapter_progress`
   - `user_preferences`

> **주의**: 테이블이 보이지 않으면 스키마 드롭다운이 `public`으로 되어 있는지 확인하세요.

---

## 3. 인증(Auth) 설정

이 프로젝트는 이메일/비밀번호 인증 방식을 사용합니다. (`signUp`, `signInWithPassword` 호출)

1. 왼쪽 사이드바에서 **Authentication** (사람 아이콘)을 클릭합니다.
2. **Settings** 탭 (또는 하단의 URL Configuration)으로 이동합니다.
3. 아래 항목을 설정합니다:

| 설정 항목 | 값 | 비고 |
|---|---|---|
| **Site URL** | `http://localhost:5173` | 개발 환경 기준 (Vite 기본 포트) |
| **Email Auth** | 활성화 (기본값) | Provider 목록에서 Email 확인 |
| **Confirm email** | OFF (개발 중) | 가입 즉시 로그인 가능하도록 |

> **참고**: "Confirm email"이 ON이면 회원가입 후 이메일 인증 링크를 클릭해야만 로그인이 가능합니다. 개발 중에는 OFF로 두면 편합니다.

> **주의 (프로덕션)**: 실제 서비스 배포 시에는 반드시 아래를 변경하세요:
> - **Site URL** 을 실제 도메인으로 변경 (예: `https://bible-reading.vercel.app`)
> - **Confirm email** 을 ON으로 변경
> - 필요 시 **Redirect URLs** 에 허용할 도메인을 추가

---

## 4. API 키 확인

앱에서 Supabase에 연결하기 위해 두 가지 값이 필요합니다.

1. 왼쪽 사이드바 하단의 **Settings** (톱니바퀴 아이콘)을 클릭합니다.
2. **API** 메뉴를 선택합니다.
3. 다음 두 값을 복사합니다:

| 항목 | 위치 | 용도 |
|---|---|---|
| **Project URL** | 상단 "Project URL" 섹션 | `VITE_SUPABASE_URL` 환경변수에 사용 |
| **anon public 키** | "Project API keys" 섹션 | `VITE_SUPABASE_ANON_KEY` 환경변수에 사용 |

Project URL은 다음과 같은 형식입니다:
```
https://abcdefghij.supabase.co
```

anon 키는 `eyJhbGciOi...`로 시작하는 긴 JWT 토큰입니다.

> **주의**: `service_role` 키는 RLS 정책을 우회하는 관리자 권한 키입니다. **절대로 프론트엔드 코드나 Git 저장소에 포함하지 마세요.** 이 프로젝트에서는 `anon` 키만 사용합니다.

---

## 5. 환경변수 설정

1. 프로젝트 루트에 `.env` 파일을 생성합니다 (`.env.example`을 참고):

```bash
cp .env.example .env
```

2. `.env` 파일을 열어 Supabase 관련 값을 입력합니다:

```env
# Supabase (Auth & Database)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **참고**: `VITE_` 접두사가 붙어야 Vite에서 클라이언트 코드에 해당 환경변수를 노출합니다. 접두사가 없으면 `import.meta.env`에서 접근할 수 없습니다.

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다. Git에 커밋되지 않도록 확인하세요.

### 연결 확인

환경변수 설정 후 앱을 실행하면 `src/services/supabase.ts`에서 자동으로 클라이언트가 생성됩니다:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

브라우저 개발자 도구의 Network 탭에서 `supabase.co`로의 요청이 정상적으로 나가는지 확인할 수 있습니다.

---

## 6. RLS (Row Level Security) 확인

이 프로젝트의 모든 테이블에는 **Row Level Security**가 활성화되어 있습니다. 이를 통해 각 사용자는 자신의 데이터만 읽고 쓸 수 있습니다.

### 적용된 RLS 정책

| 테이블 | 정책 이름 | 동작 |
|---|---|---|
| `reading_progress` | "Users can manage own reading progress" | `auth.uid() = user_id`인 행만 SELECT/INSERT/UPDATE/DELETE 가능 |
| `chapter_progress` | "Users can manage own chapter progress" | `auth.uid() = user_id`인 행만 SELECT/INSERT/UPDATE/DELETE 가능 |
| `user_preferences` | "Users can manage own preferences" | `auth.uid() = user_id`인 행만 SELECT/INSERT/UPDATE/DELETE 가능 |

### 확인 방법

1. 왼쪽 사이드바에서 **Authentication** 을 클릭합니다.
2. **Policies** 탭을 선택합니다.
3. 각 테이블 옆에 위 정책들이 표시되는지 확인합니다.

> **참고**: RLS는 `anon` 키를 사용하는 클라이언트 요청에만 적용됩니다. `service_role` 키를 사용하면 RLS가 우회됩니다. 이것이 `service_role` 키를 프론트엔드에 절대 사용하면 안 되는 이유입니다.

---

## 7. 테이블 구조 설명

### `reading_progress` - 일차별 통독 진행 상태

사용자가 288일 통독표에서 특정 일차를 완료했는지 추적합니다.

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID` | `gen_random_uuid()` | 기본 키 (자동 생성) |
| `user_id` | `UUID` | - | 사용자 ID (`auth.users` 참조, CASCADE 삭제) |
| `day_number` | `INTEGER` | - | 통독 일차 (1~288, CHECK 제약조건) |
| `completed` | `BOOLEAN` | `false` | 해당 일차 완료 여부 |
| `completed_at` | `TIMESTAMPTZ` | `null` | 완료 시각 (완료 시 기록, 취소 시 null) |
| `created_at` | `TIMESTAMPTZ` | `now()` | 레코드 생성 시각 |

- **고유 제약조건**: `(user_id, day_number)` -- 한 사용자가 같은 일차에 중복 레코드를 가질 수 없습니다.
- **인덱스**: `idx_reading_progress_user` -- `user_id` 기준 조회 최적화

### `chapter_progress` - 장(chapter)별 읽기 진행 상태

사용자가 성경의 특정 책/장을 읽었는지 추적합니다.

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID` | `gen_random_uuid()` | 기본 키 (자동 생성) |
| `user_id` | `UUID` | - | 사용자 ID (`auth.users` 참조, CASCADE 삭제) |
| `book_code` | `TEXT` | - | 성경 책 코드 (예: `gen`, `exo`, `mat`) |
| `chapter_number` | `INTEGER` | - | 장 번호 |
| `completed` | `BOOLEAN` | `false` | 해당 장 완료 여부 |
| `completed_at` | `TIMESTAMPTZ` | `null` | 완료 시각 |
| `created_at` | `TIMESTAMPTZ` | `now()` | 레코드 생성 시각 |

- **고유 제약조건**: `(user_id, book_code, chapter_number)` -- 한 사용자가 같은 책의 같은 장에 중복 레코드를 가질 수 없습니다.
- **인덱스**: `idx_chapter_progress_user` -- `user_id` 기준 조회 최적화

### `user_preferences` - 사용자 설정

각 사용자의 개인 설정을 저장합니다.

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID` | `gen_random_uuid()` | 기본 키 (자동 생성) |
| `user_id` | `UUID` | - | 사용자 ID (`auth.users` 참조, CASCADE 삭제, UNIQUE) |
| `bible_version` | `TEXT` | `'krv'` | 성경 번역본 코드 |
| `start_date` | `DATE` | `'2026-02-02'` | 통독 시작일 |
| `font_size` | `INTEGER` | `18` | 본문 글씨 크기 (px) |
| `created_at` | `TIMESTAMPTZ` | `now()` | 레코드 생성 시각 |
| `updated_at` | `TIMESTAMPTZ` | `now()` | 마지막 수정 시각 |

- **고유 제약조건**: `user_id` UNIQUE -- 사용자당 설정 레코드는 하나만 존재합니다.

> **참고**: `progressService.ts`에서 `upsert`를 사용하므로, 데이터가 없으면 INSERT, 있으면 UPDATE가 자동으로 수행됩니다. 별도의 초기화 작업이 필요하지 않습니다.

---

## 8. 문제 해결

### "new row violates row-level security policy"

**원인**: 로그인하지 않은 상태에서 데이터를 삽입/수정하려 했거나, `user_id`가 현재 로그인한 사용자의 ID와 일치하지 않습니다.

**해결**:
1. 앱에서 정상적으로 로그인되었는지 확인합니다.
2. 브라우저 개발자 도구 > Application > Local Storage에서 `sb-*-auth-token` 키가 있는지 확인합니다.
3. `authService.ts`의 `getCurrentUser()`로 현재 사용자를 가져와 `user.id`를 데이터 요청에 사용하고 있는지 확인합니다.

### "relation \"reading_progress\" does not exist"

**원인**: 데이터베이스 테이블이 생성되지 않았습니다.

**해결**:
1. Supabase 대시보드 > **SQL Editor**로 이동합니다.
2. 위의 [2. 데이터베이스 스키마 설정](#2-데이터베이스-스키마-설정) 섹션의 SQL을 다시 실행합니다.
3. 이미 일부 테이블이 존재하면 `CREATE TABLE IF NOT EXISTS`로 수정하거나, 기존 테이블을 삭제 후 재생성합니다.

### CORS 오류 ("blocked by CORS policy")

**원인**: 환경변수의 Supabase URL이 잘못되었거나 빈 값입니다.

**해결**:
1. `.env` 파일의 `VITE_SUPABASE_URL` 값이 정확한지 확인합니다.
2. URL 끝에 슬래시(`/`)가 없어야 합니다.
   - 올바름: `https://abcdefg.supabase.co`
   - 잘못됨: `https://abcdefg.supabase.co/`
3. Supabase 대시보드 > **Settings** > **API**에서 URL을 다시 복사합니다.
4. `.env` 파일 수정 후 **개발 서버를 재시작**해야 합니다 (`Ctrl+C` 후 `npm run dev`).

### "Invalid API key" 또는 "JWT expired"

**원인**: `VITE_SUPABASE_ANON_KEY` 값이 잘못되었거나 불완전하게 복사되었습니다.

**해결**:
1. Supabase 대시보드 > **Settings** > **API** > **Project API keys**에서 `anon` `public` 키를 다시 복사합니다.
2. 키 전체가 빠짐없이 복사되었는지 확인합니다 (매우 긴 문자열).
3. `.env` 파일에 값을 따옴표 없이 그대로 붙여넣습니다.

### "User already registered" (가입 시)

**원인**: 동일한 이메일로 이미 가입된 계정이 있습니다.

**해결**:
1. 로그인(`signIn`)을 시도합니다.
2. 비밀번호를 잊었다면 Supabase 대시보드 > **Authentication** > **Users**에서 해당 사용자를 삭제 후 다시 가입합니다.

### "PGRST116" 오류 (콘솔에서)

**원인**: `user_preferences` 테이블에서 `.single()`로 조회했지만 해당 사용자의 레코드가 없습니다.

**해결**: 이 오류는 `progressService.ts`에서 이미 처리되어 `null`을 반환합니다. 정상적인 동작이며, 사용자가 처음 설정을 저장하면 자동으로 레코드가 생성됩니다.

---

## 9. 프로덕션 체크리스트

서비스를 실제로 배포하기 전에 아래 항목을 확인하세요:

- [ ] **Site URL 변경**: Authentication > Settings에서 `http://localhost:5173`을 실제 도메인으로 변경
- [ ] **Redirect URLs 추가**: 실제 도메인을 Redirect URLs 목록에 추가
- [ ] **Email confirmation 활성화**: Authentication > Settings에서 "Confirm email" 토글 ON
- [ ] **Database password 보관**: 안전한 곳에 기록 (비밀번호 관리자 등)
- [ ] **환경변수 확인**: 배포 플랫폼(Vercel, Netlify 등)에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 설정되어 있는지 확인
- [ ] **`service_role` 키 미노출**: 프론트엔드 코드, Git 저장소, 빌드 로그에 `service_role` 키가 포함되지 않았는지 확인
- [ ] **Rate limiting 확인**: Supabase 대시보드에서 API 요청 제한 설정 확인
- [ ] **RLS 정책 확인**: 모든 테이블에 RLS가 활성화되어 있고 정책이 올바른지 재확인
- [ ] **백업 설정**: Supabase Pro 플랜 사용 시 자동 백업 활성화 여부 확인
