/**
 * 요나(jnh)와 나훔(nam) — 사이트 코드가 달라서 실패한 7장을 재업로드
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { config } from 'dotenv';
import * as cheerio from 'cheerio';

config();

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

function parseVerses(html: string): Record<string, string> {
  const verses: Record<string, string> = {};
  const $ = cheerio.load(html);
  $('span').each((_, el) => {
    const $el = $(el);
    const $num = $el.children('span.number');
    if ($num.length === 0) return;
    const verseNum = $num.text().trim();
    if (!verseNum || isNaN(Number(verseNum))) return;
    const clone = $el.clone();
    clone.find('span.number').remove();
    clone.find('div').remove();
    clone.find('a.comment').parent('font').remove();
    clone.find('font[size="1"]:empty').remove();
    let text = clone.text().trim().replace(/\s+/g, ' ').trim();
    if (text) verses[verseNum] = text;
  });
  return verses;
}

// 사이트 코드 → Firestore 코드 매핑
const FIXUPS = [
  { siteCode: 'jnh', fsCode: 'jon', name: '요나', chapters: 4 },
  { siteCode: 'nam', fsCode: 'nah', name: '나훔', chapters: 3 },
];

async function main() {
  for (const book of FIXUPS) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=${book.siteCode}&chap=${ch}&sec=1&cVersion=SAENEW&fontSize=15px&fontWeight=normal`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      const krv = parseVerses($('#tdBible1').html() || '');
      const nkrv = parseVerses($('#tdBible2').html() || '');

      await setDoc(doc(db, 'bible', 'krv', 'books', book.fsCode, 'chapters', String(ch)), { verses: krv });
      await setDoc(doc(db, 'bible', 'nkrv', 'books', book.fsCode, 'chapters', String(ch)), { verses: nkrv });

      console.log(`✅ ${book.name} ${ch}장 (개역개정: ${Object.keys(krv).length}절, 새번역: ${Object.keys(nkrv).length}절)`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  console.log('\n🎉 보정 완료!');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
