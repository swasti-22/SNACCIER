import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

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

const TARGET_NAMES = ["Campus Canteen", "Chai Tapri", "MURLIDHAR", "SMOOZ", "TEA POST"];

async function checkAndRemoveShops() {
  console.log("Fetching all shops from Firestore...");
  const shopsCol = collection(db, 'shops');
  const snapshot = await getDocs(shopsCol);
  
  console.log(`Total shops found in Firestore: ${snapshot.docs.length}`);
  const shopIdsToDelete = [];
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    console.log(`- Shop [${docSnap.id}]: "${name}"`);
    
    // Check if target name matches case-insensitively or exactly
    if (TARGET_NAMES.some(t => t.toLowerCase() === name.trim().toLowerCase())) {
      shopIdsToDelete.push({ id: docSnap.id, name: name });
    }
  }

  console.log(`\nShops matching removal targets:`, shopIdsToDelete);

  for (const shop of shopIdsToDelete) {
    console.log(`Deleting shop doc [${shop.id}] ("${shop.name}")...`);
    await deleteDoc(doc(db, 'shops', shop.id));

    // Also delete any menu items associated with this shop
    const menuCol = collection(db, 'menu_items');
    const menuQuery = query(menuCol, where('shop_id', '==', shop.id));
    const menuSnap = await getDocs(menuQuery);
    console.log(`Deleting ${menuSnap.docs.length} menu items for shop [${shop.id}]...`);
    for (const menuDoc of menuSnap.docs) {
      await deleteDoc(doc(db, 'menu_items', menuDoc.id));
    }
  }

  console.log("\nFinished Firestore shop and menu item cleanup.");
  process.exit(0);
}

checkAndRemoveShops().catch(err => {
  console.error("Error cleaning shops:", err);
  process.exit(1);
});
