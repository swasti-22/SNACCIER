// lib/data.js
// Preloaded Admin data for SNACCIER!
import { YOGI_MENU_ITEMS } from './yogi_menu';

export const preloadData = () => {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem("snaccier_shops");
  if (
    !existing || 
    !existing.includes("YOGI 99") || 
    !existing.includes("yogi_chn_1") ||
    existing.includes("SMOOZ") ||
    existing.includes("TEA POST") ||
    existing.includes("MURLIDHAR")
  ) {
    const defaultShops = [
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

  if (!localStorage.getItem("snaccier_users") || JSON.parse(localStorage.getItem("snaccier_users") || "[]").length === 0) {
    localStorage.setItem("snaccier_users", JSON.stringify([
      { id: "user_demo", name: "Student Demo", email: "student@charusat.edu.in", password: "password123" }
    ]));
  }
};
