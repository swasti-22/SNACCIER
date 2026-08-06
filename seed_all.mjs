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
    id: "shop_smooz",
    name: "SMOOZ",
    category: "Drinks & Shakes",
    is_open: true,
    eta: "10 mins",
    image_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop",
    pin: "1234",
  },
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
    id: "shop_teapost",
    name: "TEA POST",
    category: "Tea & Bun Maska",
    is_open: true,
    eta: "8 mins",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600&auto=format&fit=crop",
    pin: "4321",
  },
  {
    id: "shop_murlidhar",
    name: "MURLIDHAR",
    category: "Gujarati Snacks",
    is_open: true,
    eta: "15 mins",
    image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop",
    pin: "8907",
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
  // SMOOZ
  { id: "m1", shop_id: "shop_smooz", name: "Cold Coffee", price: 45, calories: 180, is_veg: true, sold_out: false, description: "Classic frothy cold coffee with chocolate dusting. Pure fuel." },
  { id: "m2", shop_id: "shop_smooz", name: "Berry Glow Smoothie", price: 70, calories: 120, is_veg: true, sold_out: false, description: "Fresh strawberry, blueberry, and natural Greek yogurt." },
  { id: "m3", shop_id: "shop_smooz", name: "Peach Ice Tea", price: 35, calories: 90, is_veg: true, sold_out: false, description: "Lemon & peach iced tea, deeply refreshing on hot campus afternoons." },
  
  // YOGI 99
  ...YOGI_MENU_ITEMS,
  
  // TEA POST
  { id: "m6", shop_id: "shop_teapost", name: "Adrak Pudina Chai", price: 20, calories: 70, is_veg: true, sold_out: false, description: "Freshly brewed hot milk tea infused with real ginger and mint leaves." },
  { id: "m7", shop_id: "shop_teapost", name: "Classic Maska Bun", price: 30, calories: 180, is_veg: true, sold_out: false, description: "Soft bakery bun split open and slathered with salted butter." },
  
  // MURLIDHAR
  { id: "m8", shop_id: "shop_murlidhar", name: "Butter Gathiya Plate", price: 50, calories: 300, is_veg: true, sold_out: false, description: "Deep fried chickpea flour savory spirals, crispy and melt-in-mouth." },
  { id: "m9", shop_id: "shop_murlidhar", name: "Special Hot Jalebi", price: 40, calories: 220, is_veg: true, sold_out: false, description: "Sweet fried loops soaked in saffron sugar syrup, made fresh." },
  
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

const DEFAULT_OPINIONS = [
  {
    id: "seed_1",
    text: "Cold coffee at SMOOZ is the only reason I survive the 9 AM lab sessions.",
    author: "Swasti",
    location: "ECE",
    tag: "Recommendations",
    reactions: { fire: 12, hearts: 8, laugh: 2 },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    approved: true,
    edit_count: 0
  },
  {
    id: "seed_2",
    text: "The Schezwan noodles at Danny's Kitchen are incredibly spicy, yet we order them every single week.",
    author: "Aarav",
    location: "CSE",
    tag: "Food Quality",
    reactions: { fire: 15, hearts: 5, laugh: 4 },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    approved: true,
    edit_count: 0
  },
  {
    id: "seed_3",
    text: "Pairing Tea Post's ginger chai with a butter-loaded bun maska is a campus ritual.",
    author: "Isha",
    location: "Mechanical",
    tag: "Recommendations",
    reactions: { fire: 9, hearts: 14, laugh: 0 },
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    approved: true,
    edit_count: 0
  },
  {
    id: "seed_4",
    text: "Pre-ordering from the lecture bench saves so much time compared to standing in the break line.",
    author: "Kabir",
    location: "Civil",
    tag: "Service Speed",
    reactions: { fire: 18, hearts: 10, laugh: 1 },
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    approved: true,
    edit_count: 0
  },
  {
    id: "seed_5",
    text: "Amul's Koko is always sold out by 2 PM. We need a larger daily restock.",
    author: "Riya",
    location: "Chemical",
    tag: "Canteen Feedback",
    reactions: { fire: 6, hearts: 4, laugh: 9 },
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    approved: true,
    edit_count: 0
  }
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

  // Add opinions to batch
  console.log(`Adding ${DEFAULT_OPINIONS.length} opinions to batch...`);
  for (const opinion of DEFAULT_OPINIONS) {
    const { id, ...data } = opinion;
    batch.set(doc(db, 'opinions', id), data);
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
