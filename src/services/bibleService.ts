import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { BibleVersion, BibleChapter } from '@/types/bible';

export async function getBibleChapter(
  version: BibleVersion,
  bookCode: string,
  chapter: number,
): Promise<BibleChapter | null> {
  const docRef = doc(
    db,
    'bible',
    version,
    'books',
    bookCode,
    'chapters',
    String(chapter),
  );
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as BibleChapter;
}

export async function getBookInfo(
  version: BibleVersion,
  bookCode: string,
): Promise<{ name: string; chapters: number; testament: string } | null> {
  const docRef = doc(db, 'bible', version, 'books', bookCode);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as { name: string; chapters: number; testament: string };
}
