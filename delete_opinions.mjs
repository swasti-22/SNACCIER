import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function clearOpinions() {
  console.log("Fetching all opinions from Firestore...");
  const opinionsCol = collection(db, 'opinions');
  const snapshot = await getDocs(opinionsCol);
  console.log(`Found ${snapshot.docs.length} opinions to delete.`);
  for (const docSnap of snapshot.docs) {
    console.log(`Deleting opinion: ${docSnap.id} => ${JSON.stringify(docSnap.data().text)}`);
    await deleteDoc(doc(db, 'opinions', docSnap.id));
  }
  console.log("All fake opinions successfully deleted from Firestore!");
  process.exit(0);
}

clearOpinions().catch((err) => {
  console.error("Failed to delete opinions:", err);
  process.exit(1);
});
