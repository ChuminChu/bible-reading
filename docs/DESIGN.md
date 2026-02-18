# 동행300일 성경통독 웹앱 -- 설계 문서

---

## 1. 프로젝트 개요

**동행300일 성경통독**은 성경 통독방을 위한 웹 애플리케이션이다. 300일(288 읽기일 + 일요일 쉼) 동안 성경 전체(구약 39권 + 신약 27권, 총 66권)를 읽는 체계적인 통독 계획을 제공한다.

| 항목 | 값 |
|------|-----|
| 통독 시작일 | **2026-02-02 (월요일)** |
| 구약 읽기일 | 216일 (929장) |
| 신약 읽기일 | 72일 (260장) |
| 총 읽기일 | **288일** |
| 주간 구성 | 월~토 통독, **일요일 쉼** |
| 총 달력 일수 | 약 336일 (48주) -- 일요일 포함 시 약 300일 |

### 핵심 기능

- 오늘의 통독 분량 확인 및 읽기 완료 체크
- 288일 전체 통독 계획 주간 단위 조회
- 성경 본문 읽기 (개역개정/새번역)
- 읽기 진행률 추적
- PWA 지원 (오프라인 사용, 홈 화면 설치)

---

## 2. 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 19.2 | UI 프레임워크 |
| **Vite** | 7.3 | 빌드 도구 및 개발 서버 |
| **TypeScript** | 5.9 | 타입 안전성 |
| **Tailwind CSS** | v4 | 유틸리티 기반 스타일링 (`@tailwindcss/vite` 플러그인) |
| **Supabase** | 2.96 | 인증(Auth) + 데이터베이스(PostgreSQL) |
| **Firebase Firestore** | 12.9 | 성경 텍스트 문서 DB (오프라인 캐싱) |
| **React Router** | v7 (7.13) | SPA 라우팅 |
| **Lucide React** | 0.574 | 아이콘 라이브러리 |
| **date-fns** | 4.1 | 날짜 계산 유틸리티 |
| **vite-plugin-pwa** | 1.2 | PWA 서비스 워커 및 매니페스트 생성 |

---

## 3. 프로젝트 구조

```
bible-reading/
├── docs/
│   └── DESIGN.md                  # 설계 문서 (이 파일)
├── public/                         # 정적 자산 (favicon, PWA 아이콘)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # DB 스키마 (테이블, RLS, 인덱스)
├── src/
│   ├── app/
│   │   ├── App.tsx                 # 라우팅 설정 + ProtectedRoute
│   │   └── Layout.tsx              # 공통 레이아웃 (main + BottomNav)
│   ├── components/
│   │   ├── BibleReader.tsx         # 성경 본문 뷰어
│   │   ├── BottomNav.tsx           # 하단 탭 네비게이션 (4탭)
│   │   ├── DayCard.tsx             # 일별 통독 카드 UI
│   │   ├── LoadingSpinner.tsx      # 로딩 인디케이터
│   │   └── ProgressRing.tsx        # 원형 진행률 표시
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Supabase 인증 상태 관리
│   │   └── BibleVersionContext.tsx  # 성경 버전 선택 상태
│   ├── data/
│   │   ├── bibleBooks.ts           # 66권 메타데이터 (코드, 이름, 장수, 정경 순서)
│   │   └── readingPlan.ts          # 288일 통독 계획 생성 알고리즘
│   ├── hooks/
│   │   ├── useBibleText.ts         # Firestore에서 성경 본문 로드
│   │   ├── useReadingProgress.ts   # Supabase 읽기 진행 상태 관리
│   │   └── useTodayReading.ts      # 오늘의 통독 분량 계산
│   ├── lib/
│   │   ├── constants.ts            # 상수 (시작일, 읽기일수, 성경 버전)
│   │   └── dayCalculation.ts       # 일자 계산 로직 (날짜 <-> 일차 변환)
│   ├── pages/
│   │   ├── HomePage.tsx            # 홈 탭 (오늘의 통독)
│   │   ├── PlanPage.tsx            # 통독 탭 (전체 계획)
│   │   ├── BiblePage.tsx           # 성경 탭 (본문 읽기)
│   │   ├── SettingsPage.tsx        # 설정 탭
│   │   └── LoginPage.tsx           # 로그인 페이지
│   ├── services/
│   │   ├── authService.ts          # Supabase 인증 API 래퍼
│   │   ├── bibleService.ts         # Firestore 성경 텍스트 조회
│   │   ├── firebase.ts             # Firebase 초기화 + Firestore 영속 캐시
│   │   ├── progressService.ts      # Supabase 진행 상태 CRUD
│   │   └── supabase.ts             # Supabase 클라이언트 초기화
│   ├── types/
│   │   ├── bible.ts                # BibleBook, BibleChapter, BibleVersion 타입
│   │   ├── plan.ts                 # DayPlan, ReadingRange, WeekGroup 타입
│   │   └── progress.ts             # ReadingProgress, ChapterProgress 타입
│   ├── env.d.ts                    # Vite 환경변수 타입 선언
│   ├── index.css                   # Tailwind 설정 + 커스텀 테마 변수
│   └── main.tsx                    # 앱 진입점 (React 루트 렌더링)
├── package.json
├── tsconfig.json
└── vite.config.ts                  # Vite + React + Tailwind + PWA 설정
```

---

## 4. 앱 구조 (4탭)

앱은 하단 탭 네비게이션(`BottomNav`)을 통해 4개 탭으로 구성된다. 인증되지 않은 사용자는 `LoginPage`로 리다이렉트된다.

| 탭 | 라우트 | 페이지 | 주요 기능 |
|----|--------|--------|-----------|
| **홈** | `/` | `HomePage` | 오늘의 통독 분량 표시, 읽기 완료 체크, 전체 진행률 링 |
| **통독** | `/plan` | `PlanPage` | 288일 전체 계획 주간 단위 목록, 일별 카드(DayCard), 완료 상태 표시 |
| **성경** | `/bible`, `/bible/:bookCode/:chapter` | `BiblePage` | 성경 66권 목록, 장 선택, 본문 읽기(BibleReader), 버전 전환 |
| **설정** | `/settings` | `SettingsPage` | 성경 버전 선택(개역개정/새번역), 글자 크기 조절, 로그아웃 |

### 라우팅 구조

```
/login              → LoginPage (비인증)
/                   → Layout + ProtectedRoute
  ├── /             → HomePage (index)
  ├── /plan         → PlanPage
  ├── /bible        → BiblePage (책 목록)
  ├── /bible/:bookCode/:chapter → BiblePage (본문 읽기)
  └── /settings     → SettingsPage
```

---

## 5. 일자 계산 로직

통독 시작일(`2026-02-02`, 월요일)을 기준으로 달력 날짜와 읽기 일차(Day Number)를 상호 변환하는 핵심 알고리즘이다. 일요일은 쉼이므로 주 6일만 읽기일로 계산한다.

### 5.1 날짜 -> 일차 변환 (`getDayNumber`)

```typescript
function getDayNumber(date: Date): number | null {
  const daysSince = differenceInCalendarDays(date, START_DATE); // 2026-02-02 기준

  if (daysSince < 0) return null;         // 시작일 이전

  const week = Math.floor(daysSince / 7); // 0-indexed 주차
  const dow  = daysSince % 7;             // 0=월, 1=화, ..., 5=토, 6=일

  if (dow === 6) return null;             // 일요일 = 쉼

  const dayNumber = week * 6 + dow + 1;   // 1-based 읽기 일차

  if (dayNumber > 288) return null;       // 계획 종료 이후

  return dayNumber;
}
```

### 5.2 일차 -> 날짜 변환 (`getDateForDay`)

```typescript
function getDateForDay(dayNumber: number): Date {
  const zeroDay    = dayNumber - 1;         // 0-indexed
  const week       = Math.floor(zeroDay / 6);
  const dayInWeek  = zeroDay % 6;
  const calendarOffset = week * 7 + dayInWeek;
  return addDays(START_DATE, calendarOffset);
}
```

### 5.3 계산 예시

| 날짜 | daysSince | week | dow | dayNumber | 비고 |
|------|-----------|------|-----|-----------|------|
| 2026-02-02 (월) | 0 | 0 | 0 | **1** | 첫째 날 |
| 2026-02-03 (화) | 1 | 0 | 1 | **2** | |
| 2026-02-07 (토) | 5 | 0 | 5 | **6** | 첫 주 마지막 읽기일 |
| 2026-02-08 (일) | 6 | 0 | 6 | **null** | 일요일 쉼 |
| 2026-02-09 (월) | 7 | 1 | 0 | **7** | 둘째 주 시작 |
| 2026-02-14 (토) | 12 | 1 | 5 | **12** | |
| 2026-02-15 (일) | 13 | 1 | 6 | **null** | 일요일 쉼 |
| 2026-02-16 (월) | 14 | 2 | 0 | **13** | 셋째 주 시작 |

### 5.4 보조 함수

| 함수 | 설명 |
|------|------|
| `isSunday(date)` | 해당 날짜가 통독 주기 기준 일요일인지 판별 (`daysSince % 7 === 6`) |
| `getCurrentWeek(date)` | 0-indexed 주차 번호 반환 (`Math.floor(daysSince / 7)`) |
| `getWeekDates(weekNumber)` | 해당 주의 7일(월~일) 날짜 배열 반환 |

---

## 6. 통독 계획 분배 알고리즘

성경의 모든 장을 288일에 걸쳐 고르게 분배하는 알고리즘이다. 구약과 신약을 별도로 분배한다.

### 6.1 분배 개요

| 구분 | 총 장수 | 읽기일 | 일 평균 |
|------|---------|--------|---------|
| 구약 (39권) | 929장 | 216일 | ~4.3장/일 |
| 신약 (27권) | 260장 | 72일 | ~3.6장/일 |
| **합계 (66권)** | **1,189장** | **288일** | **~4.1장/일** |

### 6.2 누적 반올림(Accumulator) 분배 방식

각 날에 배정할 장 수를 결정하기 위해 누적 반올림 방식을 사용한다. 이 방식은 나머지 장 수를 마지막에 몰아주지 않고 전체 기간에 고르게 분산시킨다.

```typescript
function distributeCounts(totalChapters: number, totalDays: number): number[] {
  const counts: number[] = [];
  let assigned = 0;

  for (let day = 0; day < totalDays; day++) {
    // 이 날까지 누적으로 읽어야 할 목표 장 수
    const targetCumulative = Math.round(((day + 1) * totalChapters) / totalDays);
    // 오늘 읽을 장 수 = 누적 목표 - 지금까지 배정된 장 수
    const todayCount = targetCumulative - assigned;
    counts.push(todayCount);
    assigned += todayCount;
  }

  return counts;
}
```

**동작 원리:**

1. 각 날(`day`)마다 "이 날까지 총 몇 장을 읽어야 하는가"의 누적 목표를 계산한다.
2. 누적 목표에서 이전까지 배정된 장 수를 빼면 오늘의 장 수가 된다.
3. `Math.round`로 반올림하므로, 어떤 날은 4장, 어떤 날은 5장이 되어 자연스럽게 분산된다.

**구약 예시 (929장 / 216일):**

```
Day  1: round(929 * 1/216)  - 0  = round(4.30)  - 0  = 4장
Day  2: round(929 * 2/216)  - 4  = round(8.60)  - 4  = 5장
Day  3: round(929 * 3/216)  - 9  = round(12.90) - 9  = 4장
Day  4: round(929 * 4/216)  - 13 = round(17.20) - 13 = 4장
...
```

### 6.3 범위 압축 (Range Compression)

각 날에 배정된 장들을 연속된 범위(ReadingRange)로 압축한다. 같은 책의 연속 장은 하나의 범위로 합친다.

```
배정된 장: [창세기 48, 창세기 49, 창세기 50, 출애굽기 1, 출애굽기 2]
  ↓ 압축
범위: [{ 창세기: 48-50 }, { 출애굽기: 1-2 }]
  ↓ 라벨 생성
"창 48-50, 출 1-2"
```

### 6.4 계획 구조

```
Day 1-216   : 구약 (창세기 ~ 말라기)
Day 217-288 : 신약 (마태복음 ~ 요한계시록)
```

생성된 계획은 `readingPlan` 배열에 캐싱되며, `getDayPlan(dayNumber)`로 개별 조회 가능하다.

---

## 7. 데이터 아키텍처

이 앱은 두 가지 백엔드 서비스를 사용한다: **Supabase**와 **Firebase Firestore**. 각각의 역할이 명확히 구분된다.

### 7.1 Supabase -- 인증 + 사용자 데이터

Supabase는 인증(Auth)과 사용자별 데이터를 관리하는 관계형 데이터베이스(PostgreSQL)이다.

#### 테이블 구조

**`reading_progress`** -- 일자별 읽기 완료 상태

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | 자동 생성 |
| `user_id` | UUID (FK -> auth.users) | 사용자 ID |
| `day_number` | INTEGER (1-288) | 읽기 일차 |
| `completed` | BOOLEAN | 완료 여부 |
| `completed_at` | TIMESTAMPTZ | 완료 시각 |
| `created_at` | TIMESTAMPTZ | 생성 시각 |

- UNIQUE 제약: `(user_id, day_number)`

**`chapter_progress`** -- 장별 읽기 완료 상태

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | 자동 생성 |
| `user_id` | UUID (FK -> auth.users) | 사용자 ID |
| `book_code` | TEXT | 책 코드 (예: `gen`, `mat`) |
| `chapter_number` | INTEGER | 장 번호 |
| `completed` | BOOLEAN | 완료 여부 |
| `completed_at` | TIMESTAMPTZ | 완료 시각 |
| `created_at` | TIMESTAMPTZ | 생성 시각 |

- UNIQUE 제약: `(user_id, book_code, chapter_number)`

**`user_preferences`** -- 사용자 설정

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | 자동 생성 |
| `user_id` | UUID (FK -> auth.users, UNIQUE) | 사용자 ID |
| `bible_version` | TEXT (기본: `'krv'`) | 성경 버전 |
| `start_date` | DATE (기본: `'2026-02-02'`) | 통독 시작일 |
| `font_size` | INTEGER (기본: `18`) | 글자 크기 |
| `updated_at` | TIMESTAMPTZ | 마지막 수정 시각 |

#### Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있다. 각 테이블의 정책은 동일하다:

```sql
-- 사용자는 자신의 데이터만 조회/수정/삭제 가능
CREATE POLICY "Users can manage own ..."
  ON [table] FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 인덱스

```sql
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_chapter_progress_user ON chapter_progress(user_id);
```

### 7.2 Firebase Firestore -- 성경 텍스트

성경 본문 데이터는 Firebase Firestore에 문서 형태로 저장된다.

#### 컬렉션 구조

```
bible/
  └── {version}/                    # 예: "krv" (개역개정)
      └── books/
          └── {bookCode}/           # 예: "gen" (창세기)
              ├── (document)        # 책 메타데이터: { name, chapters, testament }
              └── chapters/
                  └── {chapter}/    # 예: "1" (1장)
                      └── (document) # { book, chapter, verses: { "1": "...", "2": "...", ... } }
```

#### 조회 API

```typescript
// 특정 장의 본문 가져오기
getBibleChapter(version: BibleVersion, bookCode: string, chapter: number)
// → 경로: bible/{version}/books/{bookCode}/chapters/{chapter}

// 책 메타데이터 가져오기
getBookInfo(version: BibleVersion, bookCode: string)
// → 경로: bible/{version}/books/{bookCode}
```

#### 오프라인 캐싱

Firebase Firestore는 `persistentLocalCache`와 `persistentMultipleTabManager`를 사용하여 오프라인 캐싱을 활성화한다. 한번 로드한 성경 본문은 IndexedDB에 저장되어 오프라인에서도 읽을 수 있다.

```typescript
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

### 7.3 왜 두 서비스를 분리했는가?

| 관점 | Supabase | Firebase Firestore |
|------|----------|-------------------|
| **데이터 특성** | 사용자별 관계형 데이터 (진행률, 설정) | 정적 문서 데이터 (성경 본문) |
| **접근 제어** | RLS로 사용자별 데이터 격리 | 공개 읽기 (모든 사용자 동일 데이터) |
| **쿼리 패턴** | 관계형 쿼리 (JOIN, 집계) | 단순 문서 조회 (경로 기반) |
| **오프라인** | 서버 의존 | 내장 영속 캐시 (IndexedDB) |
| **비용** | 사용자 수 비례 | 읽기 횟수 비례 (캐시로 최소화) |

---

## 8. 디자인 테마

자연 친화적이고 따뜻한 느낌의 색상 팔레트를 사용한다. Tailwind CSS v4의 `@theme` 지시어로 커스텀 색상을 정의한다.

### 색상 팔레트

| 이름 | 코드 | 용도 |
|------|------|------|
| **Primary** | `#4A7C59` | 주요 색상 (녹색 계열), 버튼, 네비게이션 활성 상태 |
| **Background (Surface)** | `#FAFAF5` | 앱 배경색 (따뜻한 화이트) |
| **Card** | `#FFFFFF` | 카드 배경색 |
| **Accent** | `#D4A574` | 강조 색상 (갈색/골드 계열), 하이라이트 |
| **Text Primary** | `#2D2D2D` | 본문 텍스트 |
| **Text Secondary** | `#6B7280` | 보조 텍스트 |
| **Text Muted** | `#9CA3AF` | 비활성 텍스트 |

### Primary 색상 스케일

```
50:  #f0f7f2     가장 밝은 배경
100: #dceee1     밝은 배경
200: #b9ddc4     테두리/구분선
300: #8ec5a0     비활성 요소
400: #6aab7e     호버 상태
500: #4A7C59     ← 기본 Primary
600: #3d6549     눌린 상태
700: #33523d     어두운 변형
800: #2b4233
900: #24372b     가장 어두운 변형
```

### Accent 색상 스케일

```
50:  #fdf8f3
100: #f8ecdc
200: #f0d5b5
300: #e5ba8a
400: #D4A574     ← 기본 Accent
500: #c48d56
600: #b0764a
700: #925f3f
800: #774d38
900: #624130
```

### PWA 테마

```json
{
  "theme_color": "#4A7C59",
  "background_color": "#FAFAF5",
  "display": "standalone"
}
```

---

## 9. 확장 계획

### 9.1 React Native 전환 가능성

프로젝트 구조가 UI(components, pages)와 비즈니스 로직을 명확히 분리하고 있어, React Native 전환 시 다음 모듈을 그대로 재사용할 수 있다:

| 재사용 가능 (플랫폼 독립) | 재작성 필요 (플랫폼 종속) |
|--------------------------|--------------------------|
| `src/services/` -- API 서비스 | `src/components/` -- React Native 컴포넌트로 교체 |
| `src/hooks/` -- 커스텀 훅 | `src/pages/` -- 화면 UI 재구현 |
| `src/data/` -- 성경 데이터, 통독 계획 | `src/app/` -- 네비게이션 구조 변경 |
| `src/lib/` -- 일자 계산, 상수 | `src/index.css` -- StyleSheet로 변환 |
| `src/types/` -- TypeScript 타입 정의 | |
| `src/contexts/` -- Context (대부분 호환) | |

### 9.2 성경 데이터 확장

현재 Firestore에는 샘플 데이터(예: 창세기 1-5장)만 업로드되어 있다. 전체 서비스를 위해 다음 작업이 필요하다:

- **전체 66권** 성경 텍스트를 Firestore에 업로드
  - 구약 39권 (929장)
  - 신약 27권 (260장)
- **버전별 업로드**: `krv`(개역개정), `nkrv`(새번역)
- 업로드 스크립트 작성 필요 (JSON/CSV -> Firestore batch write)

### 9.3 향후 기능 추가 후보

- 통독방 그룹 기능 (함께 읽는 멤버 진행률 공유)
- 알림/리마인더 (PWA Push Notification)
- 읽기 메모/하이라이트 기능
- 통독 통계 대시보드 (주간/월간 리포트)
- 다크 모드 지원
