/**
 * Upload sample Bible data to Firestore.
 * Run with: npx tsx scripts/uploadBible.ts
 *
 * Requires FIREBASE_* env vars to be set (or .env file with dotenv).
 * Uploads Genesis 1-5 as sample data for both krv and nkrv versions.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { config } from 'dotenv';

config(); // Load .env

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

// Sample Genesis 1 (개역개정) - abbreviated for demonstration
const sampleData: Record<string, Record<string, Record<string, string>>> = {
  krv: {
    '1': {
      '1': '태초에 하나님이 천지를 창조하시니라',
      '2': '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라',
      '3': '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고',
      '4': '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사',
      '5': '하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라',
    },
    '2': {
      '1': '천지와 만물이 다 이루어지니라',
      '2': '하나님이 그가 하시던 일을 일곱째 날에 마치시니 그가 하시던 모든 일을 그치고 일곱째 날에 안식하시니라',
      '3': '하나님이 일곱째 날을 복되게 하사 거룩하게 하셨으니 이는 하나님이 그 창조하시며 만드시던 모든 일을 마치시고 그 날에 안식하셨음이니라',
    },
    '3': {
      '1': '뱀은 여호와 하나님이 지으신 들짐승 중에 가장 간교하니라 뱀이 여자에게 물어 이르되 하나님이 참으로 너희에게 동산 모든 나무의 열매를 먹지 말라 하시더냐',
      '2': '여자가 뱀에게 말하되 동산 나무의 열매를 우리가 먹을 수 있으나',
      '3': '동산 중앙에 있는 나무의 열매는 하나님의 말씀에 너희는 먹지도 말고 만지지도 말라 너희가 죽을까 하노라 하셨느니라',
    },
    '4': {
      '1': '아담이 그의 아내 하와와 동침하매 하와가 임신하여 가인을 낳고 이르되 내가 여호와로 말미암아 득남하였다 하니라',
      '2': '그가 또 가인의 아우 아벨을 낳았는데 아벨은 양 치는 자이었고 가인은 농사하는 자이었더라',
    },
    '5': {
      '1': '이것은 아담의 계보를 적은 책이니라 하나님이 사람을 창조하실 때에 하나님의 모양대로 지으시되',
      '2': '남자와 여자를 창조하셨고 그들이 창조되던 날에 하나님이 그들에게 복을 주시고 그들의 이름을 사람이라 일컬으셨더라',
    },
  },
  nkrv: {
    '1': {
      '1': '한 처음에 하나님께서 하늘과 땅을 지어내셨다.',
      '2': '땅은 아직 모양을 갖추지 않고 아무것도 생기지 않았는데, 어둠이 깊은 물 위에 뒤덮여 있었고, 하나님의 영이 그 물 위를 휩쓸고 있었다.',
      '3': '하나님께서 "빛이 생겨라!" 하시자, 빛이 생겼다.',
      '4': '그 빛이 하나님 보시기에 좋았다. 하나님께서 빛과 어둠을 나누시고,',
      '5': '빛을 낮이라 하시고, 어둠을 밤이라 하셨다. 저녁이 되고 아침이 되니, 첫째 날이다.',
    },
    '2': {
      '1': '이렇게 하늘과 땅과 그 가운데 있는 모든 것이 다 이루어졌다.',
      '2': '하나님께서 이레째 되는 날까지 하시던 일을 다 마치시고, 이레째 되는 날에는 하시던 일을 모두 그치고 쉬셨다.',
      '3': '하나님께서 이레째 되는 날을 복 주시고 거룩하게 하셨다. 하나님께서 온갖 것을 창조하시는 일을 다 마치시고 이 날에 쉬셨기 때문이다.',
    },
    '3': {
      '1': '주 하나님께서 만드신 들짐승 가운데서, 뱀이 가장 간교하였다. 뱀이 여자에게 말하였다. "하나님이 정말로 너희더러, 이 동산에 있는 나무 열매는 하나도 먹지 말라고 하시더냐?"',
      '2': '여자가 뱀에게 말하였다. "이 동산에 있는 나무 열매는 우리가 먹을 수 있다."',
      '3': '"그러나 이 동산 한가운데에 있는 나무 열매만은 하나님이 우리에게 먹지도 만지지도 말라고 하셨다. 그것을 먹으면, 우리가 죽는다고 하셨다."',
    },
    '4': {
      '1': '아담이 자기 아내 하와를 안니, 하와가 잉태하여 가인을 낳고 말하였다. "내가 주님의 도우심으로 남자 아이를 얻었다."',
      '2': '하와가 또 가인의 아우 아벨을 낳았다. 아벨은 양을 치는 목자가 되고, 가인은 땅을 부치는 농부가 되었다.',
    },
    '5': {
      '1': '이것은 아담의 족보이다. 하나님이 사람을 창조하실 때에, 하나님의 모습대로 사람을 만드시되,',
      '2': '남자와 여자로 그들을 창조하셨다. 하나님이 그들을 창조하신 날에, 그들에게 복을 주시고, 그들의 이름을 사람이라고 부르셨다.',
    },
  },
};

async function upload() {
  console.log('Uploading sample Bible data...');

  for (const [version, chapters] of Object.entries(sampleData)) {
    // Set version document
    await setDoc(doc(db, 'bible', version), {
      name: version === 'krv' ? '개역개정' : '새번역',
    });

    // Set book document
    await setDoc(doc(db, 'bible', version, 'books', 'gen'), {
      name: '창세기',
      chapters: 50,
      testament: 'OT',
    });

    // Set chapter documents
    for (const [chapter, verses] of Object.entries(chapters)) {
      await setDoc(
        doc(db, 'bible', version, 'books', 'gen', 'chapters', chapter),
        { verses },
      );
      console.log(`  Uploaded ${version}/gen/${chapter}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

upload().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
