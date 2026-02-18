# Firebase 설정 가이드

이 문서는 `bible-reading` 프로젝트에서 사용하는 Firebase/Firestore를 처음부터 설정하는 방법을 안내합니다.

---

## 1. Firebase 프로젝트 생성

1. [https://console.firebase.google.com](https://console.firebase.google.com) 에 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름 입력: `bible-reading`
4. Google Analytics: 선택사항 (비활성화해도 됨)
5. **"프로젝트 만들기"** 클릭

> 💡 프로젝트 이름은 자유롭게 변경 가능합니다. 다만 이후 생성되는 프로젝트 ID가 `.env` 설정에 사용됩니다.

---

## 2. Firestore Database 생성

1. 왼쪽 메뉴 → **빌드** → **Firestore Database**
2. **"데이터베이스 만들기"** 클릭
3. 위치 선택: `asia-northeast3 (Seoul)`
4. 보안 규칙: **"프로덕션 모드에서 시작"** 선택
5. **"만들기"** 클릭

> ⚠️ 위치는 한번 설정하면 변경할 수 없습니다. 한국 사용자 대상이라면 `asia-northeast3 (Seoul)`을 선택하세요.

---

## 3. Firestore 보안 규칙 설정

1. Firestore → **규칙** 탭 클릭
2. 기존 규칙을 아래 내용으로 교체:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bible/{version}/books/{book}/chapters/{chapter} {
      allow read: if true;
      allow write: if false;
    }
    match /bible/{version} {
      allow read: if true;
      allow write: if false;
    }
    match /bible/{version}/books/{book} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

3. **"게시"** 클릭

> 💡 성경 텍스트는 공개 데이터이므로 인증 없이 읽기를 허용합니다. 쓰기는 관리자 스크립트(`scripts/uploadBible.ts`)에서만 수행하며, 해당 스크립트는 Firebase Admin SDK가 아닌 클라이언트 SDK를 사용하므로 업로드 시에만 임시로 쓰기 규칙을 열어야 합니다 (아래 7번 참고).

---

## 4. 웹 앱 등록 및 Config 복사

1. 프로젝트 설정 (⚙️ 아이콘) → **일반** 탭
2. "내 앱" 섹션에서 **"앱 추가"** → **웹 (`</>`)** 아이콘 클릭
3. 앱 닉네임 입력: `bible-reading-web`
4. Firebase Hosting은 체크하지 않아도 됨
5. **"앱 등록"** 클릭
6. `firebaseConfig` 객체가 화면에 표시됨 → 각 값을 복사

표시되는 Config 예시:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bible-reading-xxxxx.firebaseapp.com",
  projectId: "bible-reading-xxxxx",
  storageBucket: "bible-reading-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## 5. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, 위에서 복사한 값을 입력합니다.

```bash
# Firebase (Firestore - Bible text storage)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=bible-reading-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bible-reading-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=bible-reading-xxxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> 💡 `.env.example` 파일에 전체 환경변수 목록이 있습니다. Supabase 관련 변수도 별도로 설정해야 합니다.

| 환경변수 | 대응하는 firebaseConfig 키 | 설명 |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` | API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | 인증 도메인 |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` | 프로젝트 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` | 스토리지 버킷 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | 메시징 발신자 ID |
| `VITE_FIREBASE_APP_ID` | `appId` | 앱 ID |

> ⚠️ `.env` 파일은 `.gitignore`에 포함되어야 합니다. 절대 Git에 커밋하지 마세요.

---

## 6. Firestore 데이터 구조

이 프로젝트에서 사용하는 Firestore 문서 구조는 다음과 같습니다:

```
bible (컬렉션)
├── krv (문서) → { name: "개역개정" }
│   └── books (서브컬렉션)
│       ├── gen (문서) → { name: "창세기", chapters: 50, testament: "OT" }
│       │   └── chapters (서브컬렉션)
│       │       ├── 1 (문서) → { verses: { "1": "태초에...", "2": "..." } }
│       │       ├── 2 (문서) → { verses: { ... } }
│       │       └── ...
│       ├── exo (문서) → { name: "출애굽기", ... }
│       └── ...
└── nkrv (문서) → { name: "새번역" }
    └── books (서브컬렉션)
        └── ... (같은 구조)
```

### 코드에서의 접근 경로

| 데이터 | Firestore 경로 | 코드 위치 |
|---|---|---|
| 버전 정보 | `bible/{version}` | - |
| 책 정보 | `bible/{version}/books/{bookCode}` | `bibleService.ts` → `getBookInfo()` |
| 장 데이터 | `bible/{version}/books/{bookCode}/chapters/{chapter}` | `bibleService.ts` → `getBibleChapter()` |

### 타입 정의 (`src/types/bible.ts`)

```typescript
export type BibleVersion = 'krv' | 'nkrv';  // 개역개정 | 새번역

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: Record<string, string>;  // { "1": "절 텍스트", "2": "..." }
}
```

### 왜 이 구조인가?

- **장(chapter) 단위로 문서 분리** → 필요한 장만 로드 (효율적)
- **Firestore 캐싱**으로 한번 읽은 장은 오프라인에서도 접근 가능
- **버전(krv/nkrv)별로 최상위 분리** → 버전 전환이 쉬움
- `verses`를 맵(Map)으로 저장 → 절 번호로 직접 접근 가능, 배열보다 유연함

---

## 7. 샘플 데이터 업로드

### 스크립트 정보

- 스크립트 위치: `scripts/uploadBible.ts`
- 포함된 데이터: 창세기 1~5장 (krv + nkrv), 각 장 일부 절
- 사용 라이브러리: `firebase/app`, `firebase/firestore`, `dotenv`

### 업로드 전 준비

업로드 스크립트는 클라이언트 SDK를 사용하므로, Firestore 보안 규칙에서 **임시로 쓰기를 허용**해야 합니다:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bible/{document=**} {
      allow read: if true;
      allow write: if true;  // 업로드 후 다시 false로 변경!
    }
  }
}
```

> ⚠️ 업로드 완료 후 반드시 3번의 보안 규칙으로 되돌리세요!

### 업로드 실행

```bash
# .env 파일에 Firebase config가 설정된 상태에서
npx tsx scripts/uploadBible.ts
```

정상 실행 시 출력 예시:

```
Uploading sample Bible data...
  Uploaded krv/gen/1
  Uploaded krv/gen/2
  Uploaded krv/gen/3
  Uploaded krv/gen/4
  Uploaded krv/gen/5
  Uploaded nkrv/gen/1
  Uploaded nkrv/gen/2
  Uploaded nkrv/gen/3
  Uploaded nkrv/gen/4
  Uploaded nkrv/gen/5
Done!
```

### 업로드 결과 확인

1. Firebase Console → **Firestore Database**
2. `bible` → `krv` → `books` → `gen` → `chapters` → `1` 문서 클릭
3. `verses` 필드에 절 데이터가 있으면 성공

> ✅ 업로드 후 보안 규칙을 다시 읽기 전용(`allow write: if false`)으로 변경하는 것을 잊지 마세요.

---

## 8. 전체 성경 데이터 업로드 (향후)

현재는 창세기 1~5장의 일부 절만 샘플로 포함되어 있습니다. 전체 66권을 업로드하려면:

1. 성경 텍스트 데이터를 JSON 형식으로 준비
2. `scripts/uploadBible.ts`를 수정하여 전체 데이터 처리
3. Firestore 쓰기 할당량에 주의

### Firestore 무료 할당량 (Spark Plan)

| 항목 | 일일 무료 한도 |
|---|---|
| 문서 읽기 | 50,000회 |
| 문서 쓰기 | 20,000회 |
| 문서 삭제 | 20,000회 |
| 저장 용량 | 1 GiB |

> 💡 전체 성경은 약 1,189장(구약 929 + 신약 260)입니다. 2개 버전이면 약 2,378회 쓰기 + 책 문서 + 버전 문서로, 무료 할당량 내에서 충분히 업로드 가능합니다.

텍스트가 아직 업로드되지 않은 장을 사용자가 열면 앱에서 "성경 텍스트가 아직 준비되지 않았습니다" 메시지가 표시됩니다 (`getBibleChapter()`가 `null`을 반환).

---

## 9. 오프라인 지원

`src/services/firebase.ts`에서 Firestore의 오프라인 캐싱을 활성화하고 있습니다:

```typescript
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

### 동작 방식

| 상태 | 동작 |
|---|---|
| 온라인 | Firestore 서버에서 데이터를 가져오고, 동시에 IndexedDB에 캐싱 |
| 오프라인 | IndexedDB 캐시에서 이전에 읽은 데이터를 반환 |
| 여러 탭 | `persistentMultipleTabManager`로 탭 간 캐시 공유 |

### 특징

- 한번 로드한 성경 텍스트는 **IndexedDB에 자동 캐싱**
- 오프라인에서도 **이전에 읽은 장**을 다시 볼 수 있음
- Firebase v12 모던 API 사용 (deprecated `enableMultiTabIndexedDbPersistence` 대신)
- 별도의 서비스워커 설정 없이 작동

> 💡 자주 읽는 성경 구절은 자동으로 캐싱되므로, 지하철 등 오프라인 환경에서도 말씀을 읽을 수 있습니다.

---

## 10. 문제 해결

| 증상 | 원인 | 해결 방법 |
|---|---|---|
| `Missing or insufficient permissions` | Firestore 보안 규칙에서 읽기가 허용되지 않음 | 3번의 보안 규칙이 올바르게 설정되었는지 확인 |
| `Could not reach Cloud Firestore backend` | 인터넷 연결 끊김 | 인터넷 연결 확인. 오프라인 캐시된 데이터는 정상 접근 가능 |
| 데이터가 안 보임 | 프로젝트 ID 불일치 또는 데이터 미업로드 | Firebase Console에서 프로젝트 ID가 `.env`의 `VITE_FIREBASE_PROJECT_ID`와 일치하는지 확인 |
| 업로드 스크립트 실패 | `.env` 설정 누락 또는 잘못된 값 | `.env` 파일의 Firebase 설정값 확인. `dotenv`가 `.env`를 로드하는지 확인 |
| `FirebaseError: Firebase App named '[DEFAULT]' already exists` | 앱 중복 초기화 | 개발 서버의 HMR 문제일 수 있음. 브라우저 새로고침 |
| 업로드 시 `PERMISSION_DENIED` | 보안 규칙에서 쓰기 차단 | 7번 참고: 업로드 중 임시로 쓰기 규칙을 열어야 함 |

---

## 11. 보안 참고사항

> ⚠️ Firebase API 키는 브라우저에 노출되지만, Firestore 보안 규칙이 데이터를 보호합니다.

### 보안 모델 요약

| 작업 | 허용 여부 | 이유 |
|---|---|---|
| 읽기 (read) | 모든 사용자 허용 | 성경은 공개 데이터 |
| 쓰기 (write) | 모두 거부 | 관리자 스크립트로만 업로드 |

- **API 키 자체는 프로젝트 식별용**이며, 보안 규칙이 실제 접근 제어를 담당합니다.
- 브라우저 개발자 도구에서 API 키가 보이더라도, 보안 규칙에 의해 쓰기가 차단되므로 데이터 변조는 불가능합니다.
- 추가 보안이 필요한 경우 (예: 사용자별 읽기 목록 등) Firebase Authentication을 연동하여 `request.auth`로 규칙을 강화할 수 있습니다.

> 💡 이 프로젝트에서 인증은 Supabase가 담당합니다. Firebase는 오직 성경 텍스트 저장/읽기 용도로만 사용합니다.
