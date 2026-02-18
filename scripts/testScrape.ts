/**
 * 스크래핑 테스트 — 창세기 1장만 가져와서 콘솔에 출력
 */
import * as cheerio from 'cheerio';

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

    let text = clone.text().trim();
    text = text.replace(/\s+/g, ' ').trim();

    if (text) {
      verses[verseNum] = text;
    }
  });

  return verses;
}

async function test() {
  const url = 'https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=gen&chap=1&sec=1&cVersion=SAENEW&fontSize=15px&fontWeight=normal';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const krvHtml = $('#tdBible1').html() || '';
  const nkrvHtml = $('#tdBible2').html() || '';

  const krv = parseVerses(krvHtml);
  const nkrv = parseVerses(nkrvHtml);

  console.log(`\n=== 개역개정 (${Object.keys(krv).length}절) ===`);
  for (const [num, text] of Object.entries(krv).slice(0, 5)) {
    console.log(`  ${num}. ${text}`);
  }

  console.log(`\n=== 새번역 (${Object.keys(nkrv).length}절) ===`);
  for (const [num, text] of Object.entries(nkrv).slice(0, 5)) {
    console.log(`  ${num}. ${text}`);
  }

  console.log('\n✅ 테스트 성공!');
}

test().catch(console.error);
