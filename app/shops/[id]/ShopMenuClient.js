// app/shops/[id]/ShopMenuClient.js
"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getShopById, updateOrderStatus, subscribeToMenu, subscribeToShopById } from '@/lib/db';
import { ChevronLeft, ShoppingBag, Plus, Minus, Search, Leaf, Clock, MapPin, Smile, RefreshCw, Star, Store } from 'lucide-react';
import Loader from '@/components/Loader';
const getStandardCategory = (originalCategory) => {
  return originalCategory || "Snacks";
};

const getHumorousCategory = (category, shopId) => {
  return category || "Snacks";
};

export default function ShopMenuClient({ params }) {
  // Resolve dynamic params safely using React.use() for React 19/Next 16 compatibility
  const resolvedParams = use(params);
  const shopId = resolvedParams.id;
  
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({}); // { itemId: qty }
  const router = useRouter();

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const data = await getShopById(shopId);
        setShop(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopDetails();

    // Subscribe to realtime shop operational status updates
    const unsubscribeShop = subscribeToShopById(shopId, (updatedShop) => {
      setShop(prev => {
        if (!prev) return { ...updatedShop, menu: [] };
        return { ...updatedShop, menu: prev.menu };
      });
    });

    // Subscribe to realtime menu items updates
    const unsubscribeMenu = subscribeToMenu(shopId, (updatedMenu) => {
      setShop(prev => {
        if (!prev) return prev;
        return { ...prev, menu: updatedMenu };
      });
    });
    
    // Read current local cart items
    try {
      const storedCart = JSON.parse(localStorage.getItem("snaccier_cart") || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartItems(storedCart);
      
      // Seed default quantities for items currently in cart
      const currentQuantities = {};
      storedCart.forEach(item => {
        if (item.shopId === shopId) {
          currentQuantities[item.id] = item.qty;
        }
      });
      setQuantities(currentQuantities);
    } catch (e) {}

    return () => {
      unsubscribeShop();
      unsubscribeMenu();
    };
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading menu..." />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background px-6 py-20 text-center flex flex-col items-center justify-center">
        <Store className="w-12 h-12 text-mutedGrey mb-4" />
        <h2 className="text-2xl font-bold text-textDark">Canteen not found</h2>
        <p className="text-sm text-mutedGrey mt-2">The requested shop might have been unlisted.</p>
        <button 
          onClick={() => router.push('/shops')} 
          className="mt-6 px-6 py-3 bg-primary text-textDark font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          Back to Shops
        </button>
      </div>
    );
  }

  // Categories extraction
  const categories = ['All', ...new Set(shop.menu.map(item => getHumorousCategory(item.category || shop.category, shopId)))];

  // Adjust quantities locally before adding to cart
  const handleQuantityChange = (itemId, change) => {
    if (change > 0 && shop && (shop.is_open === false || shop.is_open === 'false')) {
      alert("This canteen is currently closed. Please check back later.");
      return;
    }

    const current = quantities[itemId] || 0;
    const next = Math.max(0, current + change);
    
    // 1. Pure state update
    setQuantities(prev => ({ ...prev, [itemId]: next }));
    
    // 2. Safe side-effect executed outside the render/updater phase
    updateCartItemQuantity(itemId, next);
  };

  const updateCartItemQuantity = (itemId, qty) => {
    let currentCart = [...cartItems];
    const itemIndex = currentCart.findIndex(i => i.id === itemId && i.shopId === shopId);
    const menuItem = shop.menu.find(i => i.id === itemId);

    if (qty === 0) {
      // Remove
      if (itemIndex > -1) {
        currentCart.splice(itemIndex, 1);
      }
    } else {
      if (itemIndex > -1) {
        currentCart[itemIndex].qty = qty;
      } else if (menuItem) {
        // Add fresh item to cart
        currentCart.push({
          id: menuItem.id,
          name: menuItem.name,
          price: Number(menuItem.price),
          qty: qty,
          isVeg: menuItem.is_veg,
          shopId: shopId,
          shopName: shop.name
        });
      }
    }

    setCartItems(currentCart);
    try {
      localStorage.setItem("snaccier_cart", JSON.stringify(currentCart));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
    window.dispatchEvent(new Event("snaccier_cart")); // Dispatch global nav notifier
  };

  const handleAddToCart = (item) => {
    handleQuantityChange(item.id, 1);
  };

  // Filter menu items
  const filteredMenu = shop.menu.filter(item => {
    const itemCat = getStandardCategory(item.category || shop.category);
    const matchesCategory = activeCategory === 'All' || itemCat === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER BANNER */}
      <div className="h-64 md:h-80 relative overflow-hidden bg-secondary">
        <img 
          src={shop.image_url} 
          alt={shop.name} 
          className="w-full h-full object-cover brightness-[0.8]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-textDark/80 via-textDark/20 to-transparent" />
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push('/shops')} 
          className="absolute top-6 left-6 flex items-center gap-1 bg-white/95 text-textDark px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:bg-secondary"
        >
          <ChevronLeft className="w-4 h-4" /> Shops
        </button>

        {/* Title elements */}
        <div className="absolute bottom-6 left-6 right-6 text-white max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-textDark shadow-sm uppercase tracking-wider">
              {shop.category}
            </span>
            {shop.is_open && (
              <span className="flex items-center gap-1 text-[10px] bg-green-500/90 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                <Clock className="w-3 h-3" /> Ready in {shop.eta}
              </span>
            )}
          </div>
          <h1 className="font-poppins text-3xl md:text-5xl font-extrabold tracking-tight">
            {shop.name}
          </h1>
        </div>
      </div>

      {/* CORE MENU CONTENT */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FILTERS COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary shadow-sm bg-white"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-mutedGrey" />
          </div>

          {/* Category List */}
          <div className="bg-white p-4 rounded-2xl border border-secondary shadow-sm">
            <h3 className="font-bold text-xs uppercase text-mutedGrey tracking-wider mb-4 px-2">Menu Sections</h3>
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 no-scrollbar">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap
                    ${activeCategory === cat 
                      ? 'bg-primary text-textDark shadow-sm' 
                      : 'text-mutedGrey hover:bg-secondary/40 hover:text-textDark'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-extrabold text-2xl text-textDark font-poppins">{activeCategory} Items</h2>
            <span className="text-xs font-semibold text-mutedGrey">{filteredMenu.length} items found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMenu.length === 0 ? (
                <div className="col-span-full bg-white border border-secondary p-12 rounded-2xl text-center shadow-warm-sm flex flex-col items-center justify-center min-h-[300px]">
                  <Store className="w-12 h-12 text-mutedGrey mb-4" />
                  <h3 className="font-bold text-lg text-textDark">No menu items found</h3>
                  <p className="text-xs text-mutedGrey mt-2 max-w-xs leading-relaxed">
                    The menu selection for today is currently being updated. Please check back shortly.
                  </p>
                </div>
              ) : filteredMenu.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white border rounded-2xl p-4 flex gap-4 shadow-warm-sm hover:shadow-warm-md transition-all relative
                      ${item.sold_out ? 'border-secondary/40 bg-secondary/10' : 'border-secondary'}`}
                  >
                    {/* Image indicator */}
                    <div className={`h-24 w-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0 relative
                      ${item.sold_out ? 'opacity-40' : ''}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-primary/20 text-textDark">
                          <Store className="w-8 h-8 text-mutedGrey" />
                        </div>
                      )}
                    </div>

                    {/* Meta details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className={`font-bold text-sm text-textDark leading-tight ${item.sold_out ? 'text-mutedGrey line-through' : ''}`}>
                            {item.name}
                          </h4>
                          {item.calories && (
                            <span className="text-[9px] font-semibold text-mutedGrey whitespace-nowrap bg-secondary px-1.5 py-0.5 rounded-md">
                              {item.calories} Cal
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-mutedGrey mt-1.5 leading-relaxed font-medium line-clamp-2">
                          {item.description || 'Delicately cooked fresh campus snack, served warm.'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-secondary/35">
                        <span className="font-extrabold text-base text-textDark">₹{item.price}</span>

                        {item.sold_out ? (
                          <span className="px-3 py-1.5 bg-secondary text-mutedGrey text-[10px] font-bold rounded-xl uppercase tracking-wider">
                            Sold Out
                          </span>
                        ) : qty > 0 ? (
                          <div className="flex items-center bg-primary rounded-xl border border-primary/20 shadow-sm p-1">
                            <button 
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="p-1 rounded-lg hover:bg-white/40 text-textDark transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-textDark min-w-5 text-center">
                              {qty}
                            </span>
                            <button 
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="p-1 rounded-lg hover:bg-white/40 text-textDark transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-primary hover:bg-primary-hover hover:shadow-sm text-textDark px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* FLOAT CHECKOUT DRAWBAR (If cart contains items for this shop) */}
      {cartItems.filter(i => i.shopId === shopId).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-secondary shadow-warm-lg z-30 animate-fade-in flex justify-center">
          <div className="max-w-6xl w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/30 p-2.5 rounded-xl text-textDark">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-textDark">
                  {cartItems.filter(i => i.shopId === shopId).reduce((sum, item) => sum + item.qty, 0)} Items Added
                </h4>
                <p className="text-xs text-mutedGrey">
                  Subtotal: <span className="font-bold text-textDark">₹{cartItems.filter(i => i.shopId === shopId).reduce((sum, item) => sum + (item.price * item.qty), 0)}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/cart')}
              className="bg-primary hover:bg-primary-hover hover:shadow-warm-md text-textDark px-6 py-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-bounce"
            >
              Go to Cart <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
