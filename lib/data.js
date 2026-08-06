// lib/data.js
// Preloaded Admin data for SNACCIER!
import { YOGI_MENU_ITEMS } from './yogi_menu';

export const preloadData = () => {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem("snaccier_shops");
  // reset if the Yogi 99 shop is missing to migrate old states cleanly
  if (!existing || !existing.includes("YOGI 99") || !existing.includes("yogi_1")) {
    const defaultShops = [
      {
        id: "shop_smooz",
        name: "SMOOZ",
        category: "Drinks & Shakes",
        isOpen: true,
        eta: "10 min",
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop",
        pin: "1234",
        menu: [
          { id: "m1", name: "Cold Coffee", price: 45, cal: 180, isVeg: true, soldOut: false, desc: "Classic frothy cold coffee with chocolate dusting" },
          { id: "m2", name: "Berry Glow Smoothie", price: 70, cal: 120, isVeg: true, soldOut: false, desc: "Strawberry, blueberry, and natural yogurt" },
          { id: "m3", name: "Ice Tea", price: 35, cal: 90, isVeg: true, soldOut: false, desc: "Lemon iced tea, deeply refreshing" }
        ]
      },
      {
        id: "shop_yogi99",
        name: "YOGI 99",
        category: "Snacks & Fast Food",
        isOpen: true,
        eta: "12 min",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop",
        pin: "2231",
        menu: YOGI_MENU_ITEMS.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          cal: item.calories || null,
          isVeg: item.is_veg,
          soldOut: item.sold_out,
          desc: item.description,
          category: item.category
        }))
      },
      {
        id: "shop_teapost",
        name: "TEA POST",
        category: "Tea & Bun Maska",
        isOpen: true,
        eta: "8 min",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600&auto=format&fit=crop",
        pin: "4321",
        menu: [
          { id: "m6", name: "Adrak Pudina Chai", price: 20, cal: 70, isVeg: true, soldOut: false, desc: "Freshly brewed hot milk tea with ginger and mint" },
          { id: "m7", name: "Classic Maska Bun", price: 30, cal: 180, isVeg: true, soldOut: false, desc: "Soft bun slathered with butter" }
        ]
      },
      {
        id: "shop_murlidhar",
        name: "MURLIDHAR",
        category: "Gujarati Snacks",
        isOpen: true,
        eta: "15 min",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop",
        pin: "8907",
        menu: [
          { id: "m8", name: "Butter Gathiya Plate", price: 50, cal: 300, isVeg: true, soldOut: false, desc: "Deep fried chickpea flour savory spirals" },
          { id: "m9", name: "Special Hot Jalebi", price: 40, cal: 220, isVeg: true, soldOut: false, desc: "Sweet fried loops in saffron sugar syrup" }
        ]
      },
      {
        id: "shop_amul",
        name: "AMUL",
        category: "Dairy & Ice Cream",
        isOpen: true,
        eta: "5 min",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop",
        pin: "5678",
        menu: [
          { id: "m10", name: "Amul Kool Koko", price: 30, cal: 150, isVeg: true, soldOut: false, desc: "Rich chocolate flavoured chilled dairy beverage" },
          { id: "m11", name: "Chocolate Cone Ice Cream", price: 40, cal: 190, isVeg: true, soldOut: false, desc: "Crunchy waffle cone with chocolate ice cream" }
        ]
      },
      {
        id: "shop_sweetspot",
        name: "SWEET SPOT",
        category: "Desserts & Bakery",
        isOpen: true,
        eta: "10 min",
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop",
        pin: "9987",
        menu: [
          { id: "m12", name: "Eggless Chocolate Brownie", price: 60, cal: 240, isVeg: true, soldOut: false, desc: "Fudgy dense chocolate cake bar" },
          { id: "m13", name: "Red Velvet Pastry", price: 70, cal: 280, isVeg: true, soldOut: false, desc: "Layered sponge pastry with cream cheese frosting" }
        ]
      },
      {
        id: "shop_dannys",
        name: "DANNY'S KITCHEN",
        category: "Multi-Cuisine Meals",
        isOpen: true,
        eta: "18 min",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop",
        pin: "3242",
        menu: [
          { id: "m14", name: "Danny's Special Fried Rice", price: 90, cal: 380, isVeg: true, soldOut: false, desc: "Stir-fried rice tossed with spring onions and bell peppers" },
          { id: "m15", name: "Cheese Schezwan Noodles", price: 85, cal: 360, isVeg: true, soldOut: false, desc: "Spicy Schezwan noodles topped with grated cheese" }
        ]
      }
    ];
    localStorage.setItem("snaccier_shops", JSON.stringify(defaultShops));
  }
  
  if (!localStorage.getItem("snaccier_orders")) {
    localStorage.setItem("snaccier_orders", JSON.stringify([]));
  }

  if (!localStorage.getItem("snaccier_users")) {
    localStorage.setItem("snaccier_users", JSON.stringify([]));
  }
};
