import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
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

const DEFAULT_SHOPS = [
  {
    id: "shop_yogi99",
    name: "YOGI 99",
    category: "Snacks & Fast Food",
    is_open: true,
    eta: "12 mins",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop",
    pin: "2231",
  },
  {
    id: "shop_amul",
    name: "AMUL",
    category: "Dairy & Ice Cream",
    is_open: true,
    eta: "5 mins",
    image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop",
    pin: "5678",
  },
  {
    id: "shop_sweetspot",
    name: "SWEET SPOT",
    category: "Desserts & Bakery",
    is_open: true,
    eta: "10 mins",
    image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop",
    pin: "9987",
  },
  {
    id: "shop_dannys",
    name: "DANNY'S KITCHEN",
    category: "Multi-Cuisine Meals",
    is_open: true,
    eta: "18 mins",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
    pin: "3242",
  }
];

const DEFAULT_MENU_ITEMS = [
  // YOGI 99
  ...YOGI_MENU_ITEMS,
  
  // AMUL
  { id: "m10", shop_id: "shop_amul", name: "Amul Kool Koko", price: 30, calories: 150, is_veg: true, sold_out: false, description: "Rich chocolate flavoured chilled dairy beverage from Amul." },
  { id: "m11", shop_id: "shop_amul", name: "Chocolate Cone Ice Cream", price: 40, calories: 190, is_veg: true, sold_out: false, description: "Crunchy waffle cone loaded with chocolate fudge ice cream." },
  
  // SWEET SPOT
  { id: "m12", shop_id: "shop_sweetspot", name: "Eggless Chocolate Brownie", price: 60, calories: 240, is_veg: true, sold_out: false, description: "Fudgy dense chocolate cake bar, perfect for quick sugar kicks." },
  { id: "m13", shop_id: "shop_sweetspot", name: "Red Velvet Pastry", price: 70, calories: 280, is_veg: true, sold_out: false, description: "Layered sponge pastry with cream cheese frosting, fluffy and red." },
  
  // DANNY'S KITCHEN
  { id: "m14", shop_id: "shop_dannys", name: "Danny's Special Fried Rice", price: 90, calories: 380, is_veg: true, sold_out: false, description: "Stir-fried rice tossed with spring onions, bell peppers and special soy seasonings." },
  { id: "m15", shop_id: "shop_dannys", name: "Cheese Schezwan Noodles", price: 85, calories: 360, is_veg: true, sold_out: false, description: "Spicy Schezwan sauce tossed noodles topped with a heavy snow of cheddar." }
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Starting comprehensive Firestore batch seeding...");

  const batch = writeBatch(db);

  // Add shops to batch
  console.log(`Adding ${DEFAULT_SHOPS.length} shops to batch...`);
  for (const shop of DEFAULT_SHOPS) {
    const { id, ...data } = shop;
    batch.set(doc(db, 'shops', id), data);
  }

  // Add menu items to batch
  console.log(`Adding ${DEFAULT_MENU_ITEMS.length} menu items to batch...`);
  for (const item of DEFAULT_MENU_ITEMS) {
    const { id, ...data } = item;
    batch.set(doc(db, 'menu_items', id), data);
  }

  console.log("Committing batch write...");
  await batch.commit();

  console.log("All seeding completed successfully via Batch Write!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
