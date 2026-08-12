// lib/db.js
import { db, isFirebaseConfigured } from './firebase';
import { YOGI_MENU_ITEMS } from './yogi_menu';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit
} from 'firebase/firestore';

const isClient = typeof window !== "undefined";

const safeGetItem = (key, defaultValue = "[]") => {
  if (!isClient) {
    try {
      return JSON.parse(defaultValue);
    } catch (e) {
      return null;
    }
  }
  try {
    const val = localStorage.getItem(key);
    return JSON.parse(val || defaultValue);
  } catch (e) {
    console.error(`Malformed local storage for key ${key}:`, e);
    try {
      return JSON.parse(defaultValue);
    } catch (err) {
      return null;
    }
  }
};

const safeSetItem = (key, value) => {
  if (!isClient) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to set local storage key ${key}:`, e);
  }
};

const safeRemoveItem = (key) => {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove local storage key ${key}:`, e);
  }
};


const withTimeout = (promise, timeoutMs = 2000, fallbackValue = null) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    )
  ]).catch((err) => {
    console.warn("Firebase query timed out or failed. Falling back to local simulation data...", err);
    return fallbackValue;
  });
};

// Default seed data for campus food shops and their initial menus
export const DEFAULT_SHOPS = [
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

export const DEFAULT_MENU_ITEMS = [
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

export const DEFAULT_OPINIONS = [];

// Helper to preload seed data in LocalStorage simulation mode
export const preloadData = () => {
  if (!isClient) return;

  try {
    const existing = localStorage.getItem("snaccier_shops");
    const existingMenuItems = localStorage.getItem("snaccier_menu_items");
    // reset if deleted shops are present or Yogi 99 is missing
    if (
      !existing || 
      !existing.includes("YOGI 99") || 
      existing.includes("SMOOZ") || 
      existing.includes("TEA POST") || 
      existing.includes("MURLIDHAR") || 
      existing.includes("Campus Canteen") || 
      existing.includes("Chai Tapri") ||
      !existingMenuItems || 
      !existingMenuItems.includes("yogi_chn_1") ||
      existingMenuItems.includes("shop_smooz") ||
      existingMenuItems.includes("shop_teapost") ||
      existingMenuItems.includes("shop_murlidhar")
    ) {
      safeSetItem("snaccier_shops", JSON.stringify(DEFAULT_SHOPS));
      safeSetItem("snaccier_menu_items", JSON.stringify(DEFAULT_MENU_ITEMS));
    }

    if (!localStorage.getItem("snaccier_shops")) {
      safeSetItem("snaccier_shops", JSON.stringify(DEFAULT_SHOPS));
    }
    if (!localStorage.getItem("snaccier_menu_items")) {
      safeSetItem("snaccier_menu_items", JSON.stringify(DEFAULT_MENU_ITEMS));
    }
    if (!localStorage.getItem("snaccier_users") || JSON.parse(localStorage.getItem("snaccier_users") || "[]").length === 0) {
      safeSetItem("snaccier_users", JSON.stringify([
        { id: "user_demo", name: "Student Demo", email: "student@snaccier.com", password: "password123" }
      ]));
    }
    if (!localStorage.getItem("snaccier_orders")) {
      safeSetItem("snaccier_orders", JSON.stringify([]));
    }
    if (!localStorage.getItem("snaccier_rewards")) {
      safeSetItem("snaccier_rewards", JSON.stringify([]));
    }
    if (!localStorage.getItem("snaccier_notifications")) {
      safeSetItem("snaccier_notifications", JSON.stringify([]));
    }
    const existingOpinions = localStorage.getItem("snaccier_opinions");
    if (!existingOpinions || existingOpinions.includes("seed_") || existingOpinions.includes("SMOOZ is the only reason") || existingOpinions.includes("Amul's Koko")) {
      safeSetItem("snaccier_opinions", JSON.stringify([]));
    }
  } catch (e) {
    console.warn("Storage is blocked or disabled in this environment:", e);
  }
};

// Custom window events to trigger instant updates across components/tabs in LocalStorage mode
const triggerLocalUpdate = (collectionName) => {
  if (!isClient) return;
  const key = `snaccier_${collectionName}`;
  window.dispatchEvent(new Event(key));
};

// ==========================================
// 1. SHOPS & MENU OPERATIONS
// ==========================================
export const getShops = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const shopsCol = collection(db, 'shops');
      const q = query(shopsCol, orderBy('name'));
      
      // Wrap the getDocs call in a 2-second timeout.
      // If it takes longer (due to permission blocks or unenabled Firestore), falls back to LocalStorage instantly!
      const shops = await withTimeout(
        getDocs(q).then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        2000,
        null
      );
      
      if (shops && shops.length > 0) {
        return shops;
      }
      
      // Auto-seed only if Firestore database returned 0 shops but query was successful
      if (shops && shops.length === 0) {
        console.log("Firestore 'shops' collection is empty. Auto-seeding default campus canteens in background...");
        (async () => {
          try {
            for (const shop of DEFAULT_SHOPS) {
              const { id, ...shopData } = shop;
              await setDoc(doc(db, 'shops', id), shopData);
            }
            for (const item of DEFAULT_MENU_ITEMS) {
              const { id, ...itemData } = item;
              await setDoc(doc(db, 'menu_items', id), itemData);
            }
          } catch (e) {
            console.warn("Background auto-seeding failed (likely due to secure production write rules):", e);
          }
        })();
        return DEFAULT_SHOPS;
      }
    } catch (error) {
      console.error("Firestore getShops error:", error);
    }
  }
  
  // LocalStorage Fallback
  if (isClient) {
    preloadData();
    return safeGetItem("snaccier_shops");
  }
  return DEFAULT_SHOPS;
};

export const getShopById = async (shopId) => {
  if (isFirebaseConfigured && db) {
    try {
      const shopDocRef = doc(db, 'shops', shopId);
      
      // Wrap the single getDoc call in a 2-second timeout
      const shopSnap = await withTimeout(
        getDoc(shopDocRef),
        2000,
        null
      );
      
      if (shopSnap && shopSnap.exists()) {
        const shopData = { id: shopSnap.id, ...shopSnap.data() };
        
        // Fetch menu items with a timeout guard (no composite index requirement)
        const menuCol = collection(db, 'menu_items');
        const q = query(menuCol, where('shop_id', '==', shopId));
        const menuSnap = await withTimeout(getDocs(q), 2500, null);
        let menu = (menuSnap && !menuSnap.empty) 
          ? menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) 
          : [];
        
        if (menu.length === 0) {
          if (isClient) {
            const localItems = safeGetItem("snaccier_menu_items");
            menu = (localItems || []).filter(item => item.shop_id === shopId);
          }
          if (menu.length === 0) {
            menu = DEFAULT_MENU_ITEMS.filter(item => item.shop_id === shopId);
          }
        }
        
        menu.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return { ...shopData, menu };
      }
    } catch (error) {
      console.error("Firestore getShopById error:", error);
    }
  }

  // LocalStorage Fallback
  if (isClient) {
    preloadData();
    const shops = safeGetItem("snaccier_shops");
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      const menuItems = safeGetItem("snaccier_menu_items");
      let menu = (menuItems || []).filter(item => item.shop_id === shopId);
      if (menu.length === 0) {
        menu = DEFAULT_MENU_ITEMS.filter(item => item.shop_id === shopId);
      }
      menu.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return { ...shop, menu };
    }
  }
  
  // Hardcoded Fallback
  const shop = DEFAULT_SHOPS.find(s => s.id === shopId);
  if (shop) {
    const menu = DEFAULT_MENU_ITEMS.filter(item => item.shop_id === shopId);
    menu.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { ...shop, menu };
  }
  return null;
};
export const updateShopStatus = async (shopId, isOpen, eta) => {
  if (isFirebaseConfigured && db) {
    try {
      const shopDocRef = doc(db, 'shops', shopId);
      await updateDoc(shopDocRef, { is_open: isOpen, eta });
      return true;
    } catch (error) {
      console.error("Firestore updateShopStatus error:", error);
    }
  }

  // LocalStorage Fallback
  if (isClient) {
    const shops = safeGetItem("snaccier_shops");
    const updated = shops.map(s => s.id === shopId ? { ...s, is_open: isOpen, eta } : s);
    safeSetItem("snaccier_shops", JSON.stringify(updated));
    triggerLocalUpdate("shops");
    return true;
  }
  return false;
};

export const updateMenuItemStatus = async (itemId, soldOut) => {
  if (isFirebaseConfigured && db) {
    try {
      const itemDocRef = doc(db, 'menu_items', itemId);
      await updateDoc(itemDocRef, { sold_out: soldOut });
      return true;
    } catch (error) {
      console.error("Firestore updateMenuItemStatus error:", error);
    }
  }

  // LocalStorage Fallback
  if (isClient) {
    const items = safeGetItem("snaccier_menu_items");
    const updated = items.map(item => item.id === itemId ? { ...item, sold_out: soldOut } : item);
    safeSetItem("snaccier_menu_items", JSON.stringify(updated));
    triggerLocalUpdate("menu_items");
    return true;
  }
  return false;
};

// ==========================================
// 2. ORDER OPERATIONS
// ==========================================

export const placeOrder = async (studentId, studentName, shopId, items, notes, subtotal, total) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    throw new Error("Unable to place order: User is not authenticated.");
  }
  const newOrder = {
    student_id: studentId,
    student_name: studentName,
    shop_id: shopId,
    items,
    notes,
    subtotal,
    total,
    status: 'placed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const ordersCol = collection(db, 'orders');
      const docRef = await addDoc(ordersCol, newOrder);
      const createdOrder = { id: docRef.id, ...newOrder };
      
      // Send realtime notification for new order placed
      await addNotification(studentId, 'Order Placed!', `Your order at ${items[0]?.name || 'the shop'} has been placed. Waiting for canteen confirmation.`);
      return createdOrder;
    } catch (error) {
      console.error("Firestore placeOrder error:", error);
    }
  }

  // LocalStorage Fallback
  if (isClient) {
    preloadData();
    const localOrder = {
      ...newOrder,
      id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    const orders = safeGetItem("snaccier_orders");
    orders.push(localOrder);
    safeSetItem("snaccier_orders", JSON.stringify(orders));
    triggerLocalUpdate("orders");
    
    // Trigger notification
    await addNotification(studentId, 'Order Placed!', `Your order has been placed. Waiting for canteen confirmation.`);
    return localOrder;
  }
  return null;
};

export const getOrdersByStudent = async (studentId) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return [];
  }
  if (isFirebaseConfigured && db) {
    try {
      const ordersCol = collection(db, 'orders');
      const q = query(
        ordersCol, 
        where('student_id', '==', studentId)
      );
      const snapshot = await withTimeout(getDocs(q), 2000, null);
      if (snapshot) {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      return [];
    } catch (error) {
      console.error("Firestore getOrdersByStudent error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const orders = safeGetItem("snaccier_orders");
    return orders
      .filter(o => o.student_id === studentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return [];
};

export const getOrdersByShop = async (shopId) => {
  if (isFirebaseConfigured && db) {
    try {
      const ordersCol = collection(db, 'orders');
      const q = query(
        ordersCol, 
        where('shop_id', '==', shopId)
      );
      const snapshot = await withTimeout(getDocs(q), 2000, null);
      if (snapshot) {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      return [];
    } catch (error) {
      console.error("Firestore getOrdersByShop error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const orders = safeGetItem("snaccier_orders");
    return orders
      .filter(o => o.shop_id === shopId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return [];
};

export const updateOrderStatus = async (orderId, status) => {
  let updatedOrder = null;

  if (isFirebaseConfigured && db) {
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, { 
        status, 
        updated_at: new Date().toISOString() 
      });
      
      const orderSnap = await getDoc(orderDocRef);
      if (orderSnap.exists()) {
        updatedOrder = { id: orderSnap.id, ...orderSnap.data() };
        if (status === 'completed') {
          await incrementRewardsProgress(updatedOrder.student_id, updatedOrder.shop_id);
        }
      }
    } catch (error) {
      console.error("Firestore updateOrderStatus error:", error);
    }
  } else if (isClient) {
    const orders = safeGetItem("snaccier_orders");
    const index = orders.findIndex(o => o.id === orderId);
    if (index > -1) {
      orders[index] = { ...orders[index], status, updated_at: new Date().toISOString() };
      updatedOrder = orders[index];
      safeSetItem("snaccier_orders", JSON.stringify(orders));
      triggerLocalUpdate("orders");

      if (status === 'completed') {
        await incrementRewardsProgress(updatedOrder.student_id, updatedOrder.shop_id);
      }
    }
  }

  if (updatedOrder) {
    // Generate helpful student notifications based on progress status
    let title = "";
    let msg = "";
    if (status === 'accepted') {
      title = "Order Accepted! Chef is ready";
      msg = "Your food has been accepted by the shop owner and will start preparing shortly.";
    } else if (status === 'preparing') {
      title = "Preparing Your Snacks!";
      msg = "Maggi/Coffee is in the works. Get ready to start walking towards the shop!";
    } else if (status === 'ready') {
      title = "Ready for Pickup!";
      msg = "Your order is ready and waiting! Beat the queue, pay at the counter via cash/UPI, and grab your snacks.";
    } else if (status === 'completed') {
      title = "Enjoy your meal!";
      msg = "Hope you enjoyed your campus break! Your loyalty card has been credited.";
    }

    if (title && msg) {
      await addNotification(updatedOrder.student_id, title, msg);
    }
    return true;
  }
  return false;
};

// ==========================================
// 3. LOYALTY & REWARDS OPERATIONS
// ==========================================

export const getRewardsProgress = async (studentId, shopId) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return 0;
  }
  if (isFirebaseConfigured && db) {
    try {
      const rewardDocId = `${studentId}_${shopId}`;
      const rewardDocRef = doc(db, 'rewards_progress', rewardDocId);
      const rewardSnap = await withTimeout(getDoc(rewardDocRef), 2000, null);
      if (rewardSnap && rewardSnap.exists()) {
        return rewardSnap.data().orders_count || 0;
      }
      return 0;
    } catch (error) {
      console.error("Firestore getRewardsProgress error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const rewards = safeGetItem("snaccier_rewards");
    const found = rewards.find(r => r.student_id === studentId && r.shop_id === shopId);
    return found ? found.orders_count : 0;
  }
  return 0;
};

export const incrementRewardsProgress = async (studentId, shopId) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return 0;
  }
  if (isFirebaseConfigured && db) {
    try {
      const rewardDocId = `${studentId}_${shopId}`;
      const rewardDocRef = doc(db, 'rewards_progress', rewardDocId);
      const rewardSnap = await getDoc(rewardDocRef);
      
      let nextCount = 1;
      if (rewardSnap.exists()) {
        nextCount = (rewardSnap.data().orders_count || 0) + 1;
        await updateDoc(rewardDocRef, {
          orders_count: nextCount,
          updated_at: new Date().toISOString()
        });
      } else {
        await setDoc(rewardDocRef, {
          student_id: studentId,
          shop_id: shopId,
          orders_count: 1,
          updated_at: new Date().toISOString()
        });
      }

      if (nextCount === 5) {
        await addNotification(studentId, "Tier 1 Reward Unlocked!", "You have completed 5 orders at this canteen! Your automatic 10% discount has been applied to your next pre-order.");
      } else if (nextCount === 15) {
        await addNotification(studentId, "Tier 2 Reward Unlocked!", "You have completed 15 orders at this canteen! Your automatic 20% discount has been applied to your next 10 pre-orders.");
      }
      return nextCount;
    } catch (error) {
      console.error("Firestore incrementRewardsProgress error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const rewards = safeGetItem("snaccier_rewards");
    const index = rewards.findIndex(r => r.student_id === studentId && r.shop_id === shopId);
    let finalCount = 1;
    if (index > -1) {
      finalCount = rewards[index].orders_count + 1;
      rewards[index].orders_count = finalCount;
      rewards[index].updated_at = new Date().toISOString();
    } else {
      rewards.push({
        id: `reward_${Date.now()}`,
        student_id: studentId,
        shop_id: shopId,
        orders_count: 1,
        updated_at: new Date().toISOString()
      });
    }
    safeSetItem("snaccier_rewards", JSON.stringify(rewards));
    triggerLocalUpdate("rewards");

    if (finalCount === 5) {
      await addNotification(studentId, "Tier 1 Reward Unlocked!", "You have completed 5 orders at this canteen! Your automatic 10% discount has been applied to your next pre-order.");
    } else if (finalCount === 15) {
      await addNotification(studentId, "Tier 2 Reward Unlocked!", "You have completed 15 orders at this canteen! Your automatic 20% discount has been applied to your next 10 pre-orders.");
    }
    return finalCount;
  }
  return 0;
};

// ==========================================
// 4. NOTIFICATIONS OPERATIONS
// ==========================================

export const addNotification = async (studentId, title, message) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return false;
  }
  const newNotif = {
    student_id: studentId,
    title,
    message,
    read: false,
    created_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const notifsCol = collection(db, 'notifications');
      await addDoc(notifsCol, newNotif);
      return true;
    } catch (error) {
      console.error("Firestore addNotification error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const localNotif = {
      ...newNotif,
      id: `notif_${Date.now()}`
    };
    const notifs = safeGetItem("snaccier_notifications");
    notifs.push(localNotif);
    safeSetItem("snaccier_notifications", JSON.stringify(notifs));
    triggerLocalUpdate("notifications");
    
    // Check browser notification permission and fire it
    if (Notification.permission === "granted") {
      new Notification(`SNACCIER: ${title}`, { body: message });
    }
    return true;
  }
  return false;
};

export const getNotifications = async (studentId) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return [];
  }
  if (isFirebaseConfigured && db) {
    try {
      const notifsCol = collection(db, 'notifications');
      const q = query(
        notifsCol,
        where('student_id', '==', studentId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await withTimeout(getDocs(q), 2000, null);
      return snapshot ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];
    } catch (error) {
      console.error("Firestore getNotifications error:", error);
    }
  }

  if (isClient) {
    preloadData();
    const notifs = safeGetItem("snaccier_notifications");
    return notifs
      .filter(n => n.student_id === studentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return [];
};

export const markNotificationsRead = async (studentId) => {
  if (!studentId || studentId === 'undefined' || studentId === 'null') {
    return;
  }
  if (isFirebaseConfigured && db) {
    try {
      const notifsCol = collection(db, 'notifications');
      const q = query(
        notifsCol,
        where('student_id', '==', studentId),
        where('read', '==', false)
      );
      const snapshot = await withTimeout(getDocs(q), 2000, null);
      const promises = snapshot ? snapshot.docs.map(doc => updateDoc(doc.ref, { read: true })) : [];
      await Promise.all(promises);
    } catch (error) {
      console.error("Firestore markNotificationsRead error:", error);
    }
  }

  if (isClient) {
    const notifs = safeGetItem("snaccier_notifications");
    const updated = notifs.map(n => n.student_id === studentId ? { ...n, read: true } : n);
    safeSetItem("snaccier_notifications", JSON.stringify(updated));
    triggerLocalUpdate("notifications");
  }
};

// ==========================================
// 5. REALTIME LISTENERS / SUBSCRIPTIONS
// ==========================================

export const subscribeToOrders = (shopId, studentId, callback) => {
  if (studentId === 'undefined' || studentId === 'null') {
    studentId = null;
  }
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_orders";
      
      const handleUpdate = () => {
        const orders = safeGetItem("snaccier_orders");
        const matched = orders.filter(o => {
          if (shopId && o.shop_id !== shopId) return false;
          if (studentId && o.student_id !== studentId) return false;
          return true;
        });
        if (matched.length > 0) {
          callback(matched[matched.length - 1]); // Send the latest
        }
      };

      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const ordersCol = collection(db, 'orders');
      let q;
      if (shopId && studentId) {
        q = query(
          ordersCol,
          where('shop_id', '==', shopId),
          where('student_id', '==', studentId)
        );
      } else if (shopId) {
        q = query(
          ordersCol,
          where('shop_id', '==', shopId)
        );
      } else if (studentId) {
        q = query(
          ordersCol,
          where('student_id', '==', studentId)
        );
      } else {
        q = query(ordersCol);
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            callback({ id: change.doc.id, ...change.doc.data() });
          }
        });
      }, (error) => {
        console.error("Firestore subscribeToOrders error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToOrders error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToOrdersList = (shopId, studentId, callback) => {
  if (studentId === 'undefined' || studentId === 'null') {
    studentId = null;
  }
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_orders";
      
      const handleUpdate = () => {
        const orders = safeGetItem("snaccier_orders");
        const matched = orders
          .filter(o => {
            if (shopId && o.shop_id !== shopId) return false;
            if (studentId && o.student_id !== studentId) return false;
            return true;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        callback(matched);
      };

      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate();
      
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const ordersCol = collection(db, 'orders');
      let q;
      if (shopId && studentId) {
        q = query(
          ordersCol,
          where('shop_id', '==', shopId),
          where('student_id', '==', studentId)
        );
      } else if (shopId) {
        q = query(
          ordersCol,
          where('shop_id', '==', shopId)
        );
      } else if (studentId) {
        q = query(
          ordersCol,
          where('student_id', '==', studentId)
        );
      } else {
        q = query(ordersCol);
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }, (error) => {
        console.error("Firestore subscribeToOrdersList error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToOrdersList error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToShops = (callback) => {
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_shops";
      const handleUpdate = () => {
        const shops = safeGetItem("snaccier_shops");
        callback(shops);
      };
      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate(); // Initial call
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const shopsCol = collection(db, 'shops');
      const q = query(shopsCol, orderBy('name'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (shops.length > 0) {
          callback(shops);
        }
      }, (error) => {
        console.error("Firestore subscribeToShops error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToShops error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToNotifications = (studentId, callback) => {
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_notifications";
      const handleUpdate = () => {
        const notifs = safeGetItem("snaccier_notifications")
          .filter(n => n.student_id === studentId);
        if (notifs.length > 0) {
          callback(notifs[notifs.length - 1]);
        }
      };
      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate(); // Initial call
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const notifsCol = collection(db, 'notifications');
      const q = query(
        notifsCol,
        where('student_id', '==', studentId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            callback({ id: change.doc.id, ...change.doc.data() });
          }
        });
      }, (error) => {
        console.error("Firestore subscribeToNotifications error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToNotifications error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToMenu = (shopId, callback) => {
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_menu_items";
      const handleUpdate = () => {
        const items = safeGetItem("snaccier_menu_items");
        const filtered = items.filter(item => item.shop_id === shopId);
        callback(filtered.sort((a, b) => a.name.localeCompare(b.name)));
      };
      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate(); // Initial call
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const menuCol = collection(db, 'menu_items');
      const q = query(menuCol, where('shop_id', '==', shopId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(menu.sort((a, b) => a.name.localeCompare(b.name)));
      }, (error) => {
        console.error("Firestore subscribeToMenu error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToMenu error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToShopById = (shopId, callback) => {
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_shops";
      const handleUpdate = () => {
        const shops = safeGetItem("snaccier_shops");
        const found = shops.find(s => s.id === shopId);
        if (found) {
          callback(found);
        }
      };
      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate(); // Initial call
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const shopDocRef = doc(db, 'shops', shopId);
      const unsubscribe = onSnapshot(shopDocRef, (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
        }
      }, (error) => {
        console.error("Firestore subscribeToShopById error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToShopById error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const subscribeToOpinions = (callback) => {
  let localUnsubscribe = null;

  const startLocalFallback = () => {
    if (isClient) {
      const key = "snaccier_opinions";
      const handleUpdate = () => {
        const opinions = safeGetItem(key, JSON.stringify(DEFAULT_OPINIONS));
        callback(opinions.filter(o => !['op1', 'op2', 'op3', 'op4', 'op5'].includes(o.id)));
      };
      window.addEventListener(key, handleUpdate);
      const storageHandler = (e) => {
        if (e.key === key) handleUpdate();
      };
      window.addEventListener("storage", storageHandler);
      handleUpdate();
      localUnsubscribe = () => {
        window.removeEventListener(key, handleUpdate);
        window.removeEventListener("storage", storageHandler);
      };
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      const opinionsCol = collection(db, 'opinions');
      const q = query(opinionsCol, orderBy('created_at', 'desc'), limit(15));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        let opinions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        callback(opinions.filter(o => o.approved !== false && !['op1', 'op2', 'op3', 'op4', 'op5'].includes(o.id)));
      }, (error) => {
        console.error("Firestore subscribeToOpinions error, falling back to local:", error);
        startLocalFallback();
      });
      return () => {
        if (unsubscribe) unsubscribe();
        if (localUnsubscribe) localUnsubscribe();
      };
    } catch (error) {
      console.error("Firestore subscribeToOpinions error, falling back to local:", error);
      startLocalFallback();
      return () => {
        if (localUnsubscribe) localUnsubscribe();
      };
    }
  }

  startLocalFallback();
  return () => {
    if (localUnsubscribe) localUnsubscribe();
  };
};

export const submitOpinion = async (text, author, location, tag) => {
  const newOp = {
    text,
    author: author || "anonymous",
    location: location || "campus",
    tag: tag || "General",
    reactions: { fire: 0, hearts: 0, laugh: 0 },
    created_at: new Date().toISOString(),
    approved: true,
    edit_count: 0
  };

  if (isFirebaseConfigured && db) {
    try {
      const opinionsCol = collection(db, 'opinions');
      const docRef = await addDoc(opinionsCol, newOp);
      return docRef.id;
    } catch (e) {
      console.error("Firestore submitOpinion error:", e);
    }
  }

  if (isClient) {
    const list = safeGetItem("snaccier_opinions", JSON.stringify(DEFAULT_OPINIONS));
    const newId = `op_${Date.now()}`;
    list.unshift({ ...newOp, id: newId });
    safeSetItem("snaccier_opinions", JSON.stringify(list));
    triggerLocalUpdate("opinions");
    return newId;
  }
  return null;
};

export const deleteOpinion = async (opinionId) => {
  if (isFirebaseConfigured && db) {
    try {
      const opDocRef = doc(db, 'opinions', opinionId);
      await deleteDoc(opDocRef);
      return true;
    } catch (e) {
      console.error("Firestore deleteOpinion error:", e);
    }
  }

  if (isClient) {
    const list = safeGetItem("snaccier_opinions", JSON.stringify(DEFAULT_OPINIONS));
    const updated = list.filter(o => o.id !== opinionId);
    safeSetItem("snaccier_opinions", JSON.stringify(updated));
    triggerLocalUpdate("opinions");
    return true;
  }
  return false;
};

export const editOpinion = async (opinionId, newText) => {
  if (isFirebaseConfigured && db) {
    try {
      const opDocRef = doc(db, 'opinions', opinionId);
      const opSnap = await getDoc(opDocRef);
      if (opSnap.exists()) {
        const data = opSnap.data();
        const editCount = data.edit_count || 0;
        if (editCount >= 1) {
          throw new Error("This opinion has already been edited once.");
        }
        await updateDoc(opDocRef, {
          text: newText,
          edit_count: editCount + 1,
          updated_at: new Date().toISOString()
        });
        return true;
      }
    } catch (e) {
      console.error("Firestore editOpinion error:", e);
      throw e;
    }
  }

  if (isClient) {
    const list = safeGetItem("snaccier_opinions", JSON.stringify(DEFAULT_OPINIONS));
    const idx = list.findIndex(o => o.id === opinionId);
    if (idx > -1) {
      const editCount = list[idx].edit_count || 0;
      if (editCount >= 1) {
        throw new Error("This opinion has already been edited once.");
      }
      list[idx].text = newText;
      list[idx].edit_count = editCount + 1;
      list[idx].updated_at = new Date().toISOString();
      safeSetItem("snaccier_opinions", JSON.stringify(list));
      triggerLocalUpdate("opinions");
      return true;
    }
  }
  return false;
};

export const reactToOpinion = async (opinionId, reactionType) => {
  if (isFirebaseConfigured && db) {
    try {
      const opDocRef = doc(db, 'opinions', opinionId);
      const opSnap = await getDoc(opDocRef);
      if (opSnap.exists()) {
        const reactions = opSnap.data().reactions || { fire: 0, hearts: 0, laugh: 0 };
        reactions[reactionType] = (reactions[reactionType] || 0) + 1;
        await updateDoc(opDocRef, { reactions });
        return true;
      }
    } catch (e) {
      console.error("Firestore reactToOpinion error:", e);
    }
  }

  if (isClient) {
    const list = safeGetItem("snaccier_opinions", JSON.stringify(DEFAULT_OPINIONS));
    const idx = list.findIndex(o => o.id === opinionId);
    if (idx > -1) {
      const reactions = list[idx].reactions || { fire: 0, hearts: 0, laugh: 0 };
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      list[idx].reactions = reactions;
      safeSetItem("snaccier_opinions", JSON.stringify(list));
      triggerLocalUpdate("opinions");
      return true;
    }
  }
  return false;
};
