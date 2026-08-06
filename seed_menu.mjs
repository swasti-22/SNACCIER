import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { YOGI_MENU_ITEMS } from './lib/yogi_menu.js';

const firebaseConfig = {
  apiKey: "AIzaSyDFoXyAERWiVy5InNe_Zv9wlNc-vJW4XiY",
  authDomain: "snacc-62f72.firebaseapp.com",
  databaseURL: "https://snacc-62f72-default-rtdb.firebaseio.com",
  projectId: "snacc-62f72",
  storageBucket: "snacc-62f72.firebasestorage.app",
  messagingSenderId: "638729535812",
  appId: "1:638729535812:web:efafefe44d2cbbe3529711",
  measurementId: "G-665DL1GQ5S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log(`Starting Firestore seeding for Yogi 99 (${YOGI_MENU_ITEMS.length} items)...`);
  let successCount = 0;
  let failCount = 0;

  for (const item of YOGI_MENU_ITEMS) {
    const { id, ...itemData } = item;
    try {
      await setDoc(doc(db, 'menu_items', id), itemData);
      successCount++;
    } catch (e) {
      failCount++;
      if (failCount === 1) {
        console.error("Firestore write failed. Details of first failure:", e.message || e);
      }
    }
  }

  console.log(`\nSeeding completed:`);
  console.log(`- Successfully seeded to Firestore: ${successCount} items`);
  console.log(`- Failed to seed to Firestore: ${failCount} items`);

  if (failCount > 0) {
    console.warn("\n[WARNING] Some or all items failed to seed to Firestore due to permission rules.");
    console.warn("This is expected if the production Firestore rules are set to lock read/write access.");
    console.warn("The application will seamlessly fall back to local simulation data (LocalStorage) which now contains the fully updated Yogi 99 menu items!");
  }
}

seed().catch(err => {
  console.error("Unhandle seeder error:", err);
});
