/**
 * 대한성서공회 사이트에서 성경 텍스트를 스크래핑하여 Firestore에 업로드합니다.
 *
 * 사용법: npx tsx scripts/scrapeBible.ts
 *
 * 개역개정(GAE→krv)과 새번역(SAENEW→nkrv) 두 버전을 동시에 가져옵니다.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { config } from 'dotenv';
import * as cheerio from 'cheerio';

config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 66권 성경 메타데이터
const BOOKS = [
  { code: 'gen', name: '창세기', chapters: 50, testament: 'OT' },
  { code: 'exo', name: '출애굽기', chapters: 40, testament: 'OT' },
  { code: 'lev', name: '레위기', chapters: 27, testament: 'OT' },
  { code: 'num', name: '민수기', chapters: 36, testament: 'OT' },
  { code: 'deu', name: '신명기', chapters: 34, testament: 'OT' },
  { code: 'jos', name: '여호수아', chapters: 24, testament: 'OT' },
  { code: 'jdg', name: '사사기', chapters: 21, testament: 'OT' },
  { code: 'rut', name: '룻기', chapters: 4, testament: 'OT' },
  { code: '1sa', name: '사무엘상', chapters: 31, testament: 'OT' },
  { code: '2sa', name: '사무엘하', chapters: 24, testament: 'OT' },
  { code: '1ki', name: '열왕기상', chapters: 22, testament: 'OT' },
  { code: '2ki', name: '열왕기하', chapters: 25, testament: 'OT' },
  { code: '1ch', name: '역대상', chapters: 29, testament: 'OT' },
  { code: '2ch', name: '역대하', chapters: 36, testament: 'OT' },
  { code: 'ezr', name: '에스라', chapters: 10, testament: 'OT' },
  { code: 'neh', name: '느헤미야', chapters: 13, testament: 'OT' },
  { code: 'est', name: '에스더', chapters: 10, testament: 'OT' },
  { code: 'job', name: '욥기', chapters: 42, testament: 'OT' },
  { code: 'psa', name: '시편', chapters: 150, testament: 'OT' },
  { code: 'pro', name: '잠언', chapters: 31, testament: 'OT' },
  { code: 'ecc', name: '전도서', chapters: 12, testament: 'OT' },
  { code: 'sng', name: '아가', chapters: 8, testament: 'OT' },
  { code: 'isa', name: '이사야', chapters: 66, testament: 'OT' },
  { code: 'jer', name: '예레미야', chapters: 52, testament: 'OT' },
  { code: 'lam', name: '예레미야애가', chapters: 5, testament: 'OT' },
  { code: 'ezk', name: '에스겔', chapters: 48, testament: 'OT' },
  { code: 'dan', name: '다니엘', chapters: 12, testament: 'OT' },
  { code: 'hos', name: '호세아', chapters: 14, testament: 'OT' },
  { code: 'jol', name: '요엘', chapters: 3, testament: 'OT' },
  { code: 'amo', name: '아모스', chapters: 9, testament: 'OT' },
  { code: 'oba', name: '오바댜', chapters: 1, testament: 'OT' },
  { code: 'jon', name: '요나', chapters: 4, testament: 'OT' },
  { code: 'mic', name: '미가', chapters: 7, testament: 'OT' },
  { code: 'nah', name: '나훔', chapters: 3, testament: 'OT' },
  { code: 'hab', name: '하박국', chapters: 3, testament: 'OT' },
  { code: 'zep', name: '스바냐', chapters: 3, testament: 'OT' },
  { code: 'hag', name: '학개', chapters: 2, testament: 'OT' },
  { code: 'zec', name: '스가랴', chapters: 14, testament: 'OT' },
  { code: 'mal', name: '말라기', chapters: 4, testament: 'OT' },
  { code: 'mat', name: '마태복음', chapters: 28, testament: 'NT' },
  { code: 'mrk', name: '마가복음', chapters: 16, testament: 'NT' },
  { code: 'luk', name: '누가복음', chapters: 24, testament: 'NT' },
  { code: 'jhn', name: '요한복음', chapters: 21, testament: 'NT' },
  { code: 'act', name: '사도행전', chapters: 28, testament: 'NT' },
  { code: 'rom', name: '로마서', chapters: 16, testament: 'NT' },
  { code: '1co', name: '고린도전서', chapters: 16, testament: 'NT' },
  { code: '2co', name: '고린도후서', chapters: 13, testament: 'NT' },
  { code: 'gal', name: '갈라디아서', chapters: 6, testament: 'NT' },
  { code: 'eph', name: '에베소서', chapters: 6, testament: 'NT' },
  { code: 'php', name: '빌립보서', chapters: 4, testament: 'NT' },
  { code: 'col', name: '골로새서', chapters: 4, testament: 'NT' },
  { code: '1th', name: '데살로니가전서', chapters: 5, testament: 'NT' },
  { code: '2th', name: '데살로니가후서', chapters: 3, testament: 'NT' },
  { code: '1ti', name: '디모데전서', chapters: 6, testament: 'NT' },
  { code: '2ti', name: '디모데후서', chapters: 4, testament: 'NT' },
  { code: 'tit', name: '디도서', chapters: 3, testament: 'NT' },
  { code: 'phm', name: '빌레몬서', chapters: 1, testament: 'NT' },
  { code: 'heb', name: '히브리서', chapters: 13, testament: 'NT' },
  { code: 'jas', name: '야고보서', chapters: 5, testament: 'NT' },
  { code: '1pe', name: '베드로전서', chapters: 5, testament: 'NT' },
  { code: '2pe', name: '베드로후서', chapters: 3, testament: 'NT' },
  { code: '1jn', name: '요한1서', chapters: 5, testament: 'NT' },
  { code: '2jn', name: '요한2서', chapters: 1, testament: 'NT' },
  { code: '3jn', name: '요한3서', chapters: 1, testament: 'NT' },
  { code: 'jud', name: '유다서', chapters: 1, testament: 'NT' },
  { code: 'rev', name: '요한계시록', chapters: 22, testament: 'NT' },
];

const TOTAL_CHAPTERS = BOOKS.reduce((sum, b) => sum + b.chapters, 0);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * HTML에서 절 텍스트를 추출합니다.
 * 구조: <span><span class="number">1&nbsp;&nbsp;&nbsp;</span>절 텍스트</span>
 */
function parseVerses(html: string): Record<string, string> {
  const verses: Record<string, string> = {};
  const $ = cheerio.load(html);

  // 각 절은 <span> > <span class="number"> 구조
  $('span').each((_, el) => {
    const $el = $(el);
    const $num = $el.children('span.number');
    if ($num.length === 0) return;

    const verseNum = $num.text().trim();
    if (!verseNum || isNaN(Number(verseNum))) return;

    // 절 번호 span을 제거한 후 나머지 텍스트를 추출
    const clone = $el.clone();
    clone.find('span.number').remove();
    // 주석 팝업 div 제거
    clone.find('div').remove();
    // 주석 링크(각주 번호) 제거
    clone.find('a.comment').parent('font').remove();
    // 빈 font 태그 제거
    clone.find('font[size="1"]:empty').remove();

    let text = clone.text().trim();
    // 여러 공백을 하나로
    text = text.replace(/\s+/g, ' ').trim();

    if (text) {
      verses[verseNum] = text;
    }
  });

  return verses;
}

async function fetchChapter(
  bookCode: string,
  chapter: number,
): Promise<{ krv: Record<string, string>; nkrv: Record<string, string> }> {
  const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=${bookCode}&chap=${chapter}&sec=1&cVersion=SAENEW&fontSize=15px&fontWeight=normal`;

  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const krvHtml = $('#tdBible1').html() || '';
  const nkrvHtml = $('#tdBible2').html() || '';

  return {
    krv: parseVerses(krvHtml),
    nkrv: parseVerses(nkrvHtml),
  };
}

async function uploadToFirestore(
  version: string,
  bookCode: string,
  chapter: number,
  verses: Record<string, string>,
) {
  const docRef = doc(db, 'bible', version, 'books', bookCode, 'chapters', String(chapter));
  await setDoc(docRef, { verses });
}

async function main() {
  console.log(`\n📖 성경 스크래핑 시작 (총 ${TOTAL_CHAPTERS}장)\n`);

  // 버전 문서 생성
  await setDoc(doc(db, 'bible', 'krv'), { name: '개역개정' });
  await setDoc(doc(db, 'bible', 'nkrv'), { name: '새번역' });

  let done = 0;
  let errors: string[] = [];

  for (const book of BOOKS) {
    // 책 메타데이터 업로드
    await setDoc(doc(db, 'bible', 'krv', 'books', book.code), {
      name: book.name,
      chapters: book.chapters,
      testament: book.testament,
    });
    await setDoc(doc(db, 'bible', 'nkrv', 'books', book.code), {
      name: book.name,
      chapters: book.chapters,
      testament: book.testament,
    });

    for (let ch = 1; ch <= book.chapters; ch++) {
      try {
        const { krv, nkrv } = await fetchChapter(book.code, ch);

        const krvCount = Object.keys(krv).length;
        const nkrvCount = Object.keys(nkrv).length;

        if (krvCount === 0) {
          throw new Error('개역개정 절 데이터 없음');
        }

        await uploadToFirestore('krv', book.code, ch, krv);
        await uploadToFirestore('nkrv', book.code, ch, nkrv);

        done++;
        const pct = ((done / TOTAL_CHAPTERS) * 100).toFixed(1);
        process.stdout.write(
          `\r  [${pct}%] ${book.name} ${ch}장 완료 (개역개정: ${krvCount}절, 새번역: ${nkrvCount}절) — ${done}/${TOTAL_CHAPTERS}`,
        );

        // 서버 부담 줄이기: 요청 간 딜레이
        await sleep(300);
      } catch (err) {
        const msg = `${book.name} ${ch}장 실패: ${err}`;
        errors.push(msg);
        console.error(`\n  ❌ ${msg}`);
        // 에러 시 잠시 더 대기 후 계속
        await sleep(1000);
        done++;
      }
    }

    console.log(`\n✅ ${book.name} 완료 (${book.chapters}장)`);
  }

  console.log(`\n\n📊 결과: ${done}/${TOTAL_CHAPTERS}장 처리`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length}개 에러:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log('🎉 모든 장이 성공적으로 업로드되었습니다!');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n치명적 오류:', err);
  process.exit(1);
});
