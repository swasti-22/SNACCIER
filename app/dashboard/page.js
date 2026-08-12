// app/dashboard/page.js
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  updateOrderStatus, 
  getRewardsProgress,
  placeOrder,
  subscribeToShops,
  subscribeToOrdersList
} from '@/lib/db';
import { 
  ShoppingBag, Check, Play, CheckCircle2, FileText, AlertCircle, 
  RefreshCw, Volume2, User, Clock, Mail, Send, CheckCircle, 
  Store, Gift, ChevronRight, MessageSquare, Plus, Minus, Trash2, Award, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Loader from '@/components/Loader';

// ============================================================================
// STUDENT PORTAL: HIGH-END CONSOLIDATED SPA
// ============================================================================
function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'cart' | 'track' | 'rewards'
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null); // shop object with menu items
  const [orders, setOrders] = useState([]);
  const [progress, setProgress] = useState({}); // { shopId: count }
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Suggestions Grievances Form
  const [grievance, setGrievance] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const syncCartFromLocal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("snaccier_cart") || "[]");
      setCart(stored);
    } catch (e) {
      setCart([]);
    }
  };

  // Load basic data
  useEffect(() => {
    // Sync Cart initial state
    syncCartFromLocal();

    // 1. Subscribe to realtime shops
    const unsubscribeShops = subscribeToShops((loadedShops) => {
      if (Array.isArray(loadedShops)) {
        setShops(loadedShops);
        
        // Select initial shop if not selected yet
        if (loadedShops.length > 0 && !selectedShop) {
          const initialShop = loadedShops.find(s => s.id === 'shop_yogi99') || loadedShops[0];
          import('@/lib/db').then(db => db.getShopById(initialShop.id)).then(fullDetails => {
            setSelectedShop(fullDetails);
          });
        }

        // Fetch all shop rewards milestone progress concurrently
        const progressMap = {};
        Promise.all(
          loadedShops.map(async (s) => {
            const count = await getRewardsProgress(user.id, s.id);
            progressMap[s.id] = count || 0;
          })
        ).then(() => {
          setProgress(progressMap);
        });
      }
    });

    // 2. Subscribe to realtime orders for this student
    const unsubscribeOrders = subscribeToOrdersList(null, user.id, (ordersList) => {
      setOrders(ordersList);
      setLoading(false);
    });

    // Listen to global cart events
    window.addEventListener("snaccier_cart", syncCartFromLocal);

    return () => {
      unsubscribeOrders();
      unsubscribeShops();
      window.removeEventListener("snaccier_cart", syncCartFromLocal);
    };
  }, [user]);

  const handleSelectShop = async (shopId) => {
    setLoading(true);
    try {
      const fullShop = await import('@/lib/db').then(db => db.getShopById(shopId));
      setSelectedShop(fullShop);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const updateCartQuantity = (item, change) => {
    const shopId = item.shopId || item.shop_id;
    const targetShop = shops.find(s => s.id === shopId);
    if (change > 0 && targetShop && (targetShop.is_open === false || targetShop.is_open === 'false')) {
      alert("This canteen is currently closed. Please check back later.");
      return;
    }

    const currentCart = [...cart];
    const index = currentCart.findIndex(c => c.id === item.id);
    
    if (index > -1) {
      const nextQty = currentCart[index].qty + change;
      if (nextQty <= 0) {
        currentCart.splice(index, 1);
      } else {
        currentCart[index].qty = nextQty;
      }
    } else if (change > 0) {
      currentCart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.is_veg,
        shopId: item.shop_id,
        qty: 1
      });
    }

    try {
      localStorage.setItem("snaccier_cart", JSON.stringify(currentCart));
    } catch (e) {
      console.warn("Cart write failed:", e);
    }
    setCart(currentCart);
    window.dispatchEvent(new Event("snaccier_cart"));
  };

  const removeFromCart = (itemId) => {
    const updated = cart.filter(c => c.id !== itemId);
    try {
      localStorage.setItem("snaccier_cart", JSON.stringify(updated));
    } catch (e) {
      console.warn("Cart remove write failed:", e);
    }
    setCart(updated);
    window.dispatchEvent(new Event("snaccier_cart"));
  };

  const clearCart = () => {
    try {
      localStorage.setItem("snaccier_cart", "[]");
    } catch (e) {
      console.warn("Cart clear write failed:", e);
    }
    setCart([]);
    window.dispatchEvent(new Event("snaccier_cart"));
  };

  // Checkout pre-order
  const handlePreOrderCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    
    try {
      const shopsInCart = [...new Set(cart.map(item => item.shopId))];
      
      // Check if any of the canteens are closed
      for (const shopId of shopsInCart) {
        const targetShop = shops.find(s => s.id === shopId);
        if (targetShop && (targetShop.is_open === false || targetShop.is_open === 'false')) {
          alert("This canteen is currently closed. Please check back later.");
          setLoading(false);
          return;
        }
      }

      // Settle orders per shop
      for (const shopId of shopsInCart) {
        const shopItems = cart.filter(i => i.shopId === shopId);
        const subtotal = shopItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const total = subtotal;

        await placeOrder(
          user.id,
          user.name || 'Anonymous Student',
          shopId,
          shopItems,
          notes,
          subtotal,
          total
        );
      }

      clearCart();
      setNotes("");
      setActiveTab('track'); // Auto-switch to Trackers tab!
    } catch (e) {
      console.error(e);
      alert("Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrievanceSubmit = (e) => {
    e.preventDefault();
    if (!grievance.trim()) return;

    const studentName = user?.name || 'Anonymous Student';
    const studentEmail = user?.email || 'No email';
    const subject = encodeURIComponent("SNACCIER Campus Feedback & Suggestion");
    const body = encodeURIComponent(`Hi Swasti,\n\nI wanted to share the following suggestion/grievance regarding my campus experience:\n\n"${grievance}"\n\n- ${studentName} (${studentEmail})`);
    
    window.location.href = `mailto:swastiivv.22@gmail.com?subject=${subject}&body=${body}`;
    
    setFormSuccess(true);
    setGrievance("");
    setTimeout(() => setFormSuccess(false), 5000);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const activeTrackers = orders.filter(o => o.status !== 'completed');
  const pastOrders = orders.filter(o => o.status === 'completed');
  
  const STAGES = [
    { key: 'placed', label: 'Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Cooking' },
    { key: 'ready', label: 'Ready' }
  ];

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'ST';
    return name
      .split(' ')
      .filter(part => part && part.trim().length > 0)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const initials = getInitials(user?.name);

  return (
    <div className="min-h-screen bg-[#FFFDFB] p-4 max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* 1. COMPACT STUDENT ID CREDENTIALS */}
      <div className="bg-white border border-secondary px-5 py-4 rounded-2xl shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/25 border border-primary flex items-center justify-center text-primary-hover font-black text-sm font-poppins">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-poppins text-base font-extrabold text-textDark tracking-tight leading-none">{user?.name || 'Anonymous Student'}</h2>
              <span className="bg-primary/20 text-primary-hover text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Student
              </span>
            </div>
            <p className="text-[10px] text-mutedGrey font-bold uppercase tracking-wider mt-1">{user?.email || 'student@snaccier.com'}</p>
          </div>
        </div>

        {/* Quick status counters */}
        <div className="flex gap-4 text-xs font-bold text-textDark">
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-secondary px-3 py-1.5 rounded-xl">
            <ShoppingBag className="w-3.5 h-3.5 text-primary-hover" />
            <span>Cart: {cart.reduce((sum, item) => sum + item.qty, 0)} Items</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-secondary px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Active: {activeTrackers.length} Orders</span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC Framer Motion GLIDING TABS SELECTOR */}
      <div className="flex bg-[#FAF9F6] border border-secondary p-1 rounded-xl shadow-inner relative justify-between sm:justify-start gap-1">
        {[
          { id: 'order', label: 'Order Food' },
          { id: 'cart', label: `Cart (${cart.reduce((sum, item) => sum + item.qty, 0)})` },
          { id: 'track', label: `Trackers (${activeTrackers.length})` },
          { id: 'rewards', label: 'Stamp Club' }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const renderTabIcon = (tabId) => {
            switch(tabId) {
              case 'order': return <Store className="w-4 h-4" />;
              case 'cart': return <ShoppingBag className="w-4 h-4" />;
              case 'track': return <Compass className="w-4 h-4" />;
              case 'rewards': return <Gift className="w-4 h-4" />;
              default: return null;
            }
          };
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all relative cursor-pointer flex items-center justify-center gap-1.5
                ${isSelected ? 'bg-white text-textDark shadow-sm font-black' : 'text-mutedGrey hover:text-textDark'}`}
            >
              {renderTabIcon(tab.id)}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. DYNAMIC TAB WINDOW RENDERING */}
      <div className="min-h-[50vh] bg-white border border-secondary rounded-2xl p-5 shadow-warm-sm">
        
        {loading && (
          <div className="flex flex-col justify-center items-center gap-4 py-16">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs font-semibold text-mutedGrey">loading...</span>
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            
            {/* ==================== TAB 1: ORDER CANTEENS ==================== */}
            {activeTab === 'order' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Horizontal Shop Selector Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {shops.map((shop) => {
                    const isSelected = selectedShop?.id === shop.id;
                    return (
                      <button
                        key={shop.id}
                        onClick={() => handleSelectShop(shop.id)}
                        className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer
                          ${isSelected 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-white border-secondary hover:border-secondary-hover'}`}
                      >
                        <div>
                          <h4 className="font-poppins font-extrabold text-xs text-textDark">{shop.name}</h4>
                          <span className="text-[9px] font-bold text-mutedGrey block mt-0.5 uppercase">{shop.category}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider block mt-1.5 px-2 py-0.5 rounded-full w-max
                            ${shop.is_open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {shop.is_open ? `Open • ${shop.eta} wait` : 'Closed'}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-mutedGrey transition-transform duration-300 group-hover:translate-x-0.5
                          ${isSelected ? 'text-primary-hover rotate-90 sm:rotate-0' : ''}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Inline Canteen Menu Viewer */}
                {selectedShop ? (
                  <div className="space-y-6 pt-4 border-t border-secondary/55">
                    <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl">
                      <div>
                        <h4 className="font-poppins font-black text-sm text-textDark uppercase tracking-wider">{selectedShop.name} Menu</h4>
                        <p className="text-[10px] text-mutedGrey font-medium mt-0.5">Vegetarian delicacies cooked fresh</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedShop.menu && selectedShop.menu.length === 0 ? (
                        <div className="col-span-full bg-white border border-secondary p-8 rounded-xl text-center shadow-sm flex flex-col items-center justify-center min-h-[200px]">
                          <Store className="w-10 h-10 text-mutedGrey mb-2" />
                          <h4 className="font-bold text-sm text-textDark">Menu is currently empty</h4>
                          <p className="text-[10px] text-mutedGrey mt-1 max-w-xs">
                            Bhaiya is currently updating the menu selection. Check back in a few minutes!
                          </p>
                        </div>
                      ) : selectedShop.menu && selectedShop.menu.map((dish) => {
                        const cartItem = cart.find(c => c.id === dish.id);
                        const isSoldOut = dish.sold_out;

                        return (
                          <div 
                            key={dish.id} 
                            className={`p-4 rounded-xl border border-secondary flex justify-between items-center transition-all relative overflow-hidden
                              ${isSoldOut ? 'opacity-50' : 'hover:shadow-warm-sm bg-white'}`}
                          >
                            <div className="space-y-1 pr-4 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-extrabold text-xs text-textDark">{dish.name}</h5>
                              </div>
                              <p className="text-[10px] text-mutedGrey font-medium leading-normal">{dish.description}</p>
                              <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-textDark">
                                <span>₹{dish.price}</span>
                                <span className="text-mutedGrey text-[9px]">{dish.calories} kcal</span>
                              </div>
                            </div>

                            {/* Cart adjusters inline */}
                            <div>
                              {isSoldOut ? (
                                <span className="bg-red-50 text-red-600 text-[8px] font-black px-2.5 py-1 rounded-lg uppercase">Sold Out</span>
                              ) : cartItem ? (
                                <div className="flex items-center gap-2 bg-[#FAF9F6] border border-secondary p-1 rounded-xl shadow-inner">
                                  <button 
                                    onClick={() => updateCartQuantity(dish, -1)}
                                    className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-textDark shadow-sm hover:bg-secondary/40"
                                  >
                                    <Minus className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <span className="text-[11px] font-black text-textDark px-1 min-w-[12px] text-center">{cartItem.qty}</span>
                                  <button 
                                    onClick={() => updateCartQuantity(dish, 1)}
                                    className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-textDark shadow-sm hover:bg-secondary/40"
                                  >
                                    <Plus className="w-3 h-3 stroke-[3]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    updateCartQuantity(dish, 1);
                                  }}
                                  className="px-3.5 py-1.5 bg-primary text-textDark font-black rounded-xl text-[10px] shadow-sm hover:shadow-warm-md transition-bounce cursor-pointer"
                                >
                                  Add to Cart
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs font-semibold text-mutedGrey">
                    Please select a canteen above to browse menus.
                  </div>
                )}
              </motion.div>
            )}

            {/* ==================== TAB 2: MY CART ==================== */}
            {activeTab === 'cart' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {cart.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    
                    {/* Items list */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="font-poppins font-extrabold text-xs uppercase text-mutedGrey tracking-wider">My Basket</h4>
                        <button 
                          onClick={clearCart}
                          className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Empty Basket
                        </button>
                      </div>

                      <div className="bg-white border border-secondary rounded-2xl divide-y divide-secondary/40 overflow-hidden shadow-warm-sm">
                        {cart.map((item) => (
                          <div key={item.id} className="p-4 flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="text-textDark">{item.name}</span>
                              </div>
                              <span className="text-[10px] text-mutedGrey font-bold">₹{item.price} each</span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 bg-[#FAF9F6] border border-secondary p-1 rounded-xl shadow-inner">
                                <button 
                                  onClick={() => updateCartQuantity(item, -1)}
                                  className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-textDark shadow-sm hover:bg-secondary/40"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                </button>
                                <span className="text-[11px] font-black text-textDark px-1 min-w-[12px] text-center">{item.qty}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item, 1)}
                                  className="h-6 w-6 rounded-lg bg-white flex items-center justify-center text-textDark shadow-sm hover:bg-secondary/40"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom instructions box */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Canteen Instructions</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="e.g. Less sugar in coffee, no onions..."
                          className="w-full border border-secondary rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary bg-[#FAF9F6]"
                        />
                      </div>
                    </div>

                    {/* Bill breakdown drawer */}
                    <div className="md:col-span-5 bg-[#FAF9F6] border border-secondary p-5 rounded-2xl shadow-warm-sm space-y-4">
                      <h4 className="font-poppins font-black text-sm text-textDark uppercase tracking-wider pb-2 border-b border-secondary/55">Review Order</h4>
                      
                      <div className="space-y-2 text-xs font-semibold text-textDark">
                        <div className="flex justify-between">
                          <span className="text-mutedGrey">Subtotal</span>
                          <span>₹{subtotal}</span>
                        </div>
                        
                        <div className="pt-3 border-t border-secondary/55 flex justify-between font-black text-sm">
                          <span>Total Bill</span>
                          <span>₹{subtotal}</span>
                        </div>
                      </div>

                      <div className="bg-white/70 border border-secondary/60 p-3 rounded-xl text-[10px] text-mutedGrey leading-relaxed font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-textDark flex-shrink-0" />
                        <span>*Pay at the counter* — Pre-orders are free to place. Settle your bill directly via cash or UPI at the counter when you pick up.</span>
                      </div>

                      <button
                        onClick={handlePreOrderCheckout}
                        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-textDark font-black rounded-xl text-xs shadow-sm hover:shadow-warm-md hover:scale-[1.01] transition-bounce cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Place Pre-Order (₹{subtotal})
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-14 space-y-4">
                    <ShoppingBag className="w-12 h-12 text-mutedGrey mx-auto animate-pulse" />
                    <h4 className="font-bold text-sm text-textDark">Your basket is empty</h4>
                    <p className="text-xs text-mutedGrey max-w-xs mx-auto leading-relaxed">
                      Choose a canteen from the menu tab to add items to your basket.
                    </p>
                    <button 
                      onClick={() => setActiveTab('order')}
                      className="px-6 py-2.5 bg-primary text-textDark font-extrabold rounded-xl text-xs transition-bounce shadow-sm hover:shadow-warm-md cursor-pointer"
                    >
                      Browse Menus
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ==================== TAB 3: ACTIVE TRACKERS ==================== */}
            {activeTab === 'track' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Active trackers timeline pipeline */}
                <div className="space-y-4">
                  <h4 className="font-poppins font-extrabold text-sm text-textDark flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                    <span>Active Orders ({activeTrackers.length})</span>
                  </h4>

                  {activeTrackers.length > 0 ? (
                    <div className="space-y-4">
                      {activeTrackers.map((order) => {
                        const currentIdx = STAGES.findIndex(s => s.key === order.status);
                        return (
                          <div key={order.id} className="bg-white rounded-2xl border border-secondary p-5 shadow-warm-md space-y-4 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                            
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2 font-poppins">
                                <span className="font-extrabold text-textDark">
                                  {shops.find(s => s.id === order.shop_id)?.name || 'Canteen'}
                                </span>
                                <span className="text-mutedGrey uppercase font-medium text-[10px]">#{order.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <span className="font-black text-textDark">₹{order.total}</span>
                            </div>

                            {/* Checklist style active trackers */}
                            <div className="space-y-2 pt-2 bg-[#FDFBF7] p-4 rounded-2xl border-2 border-dashed border-textDark/20">
                              <div className="text-xs text-mutedGrey font-medium leading-none mb-1 select-none">
                                Preparation Status
                              </div>
                              <div className="flex flex-col gap-2 font-bold text-[11px] pl-1 pt-1.5">
                                {STAGES.map((stage, idx) => {
                                  const isCompleted = idx <= currentIdx;
                                  const isCurrent = idx === currentIdx;
                                  return (
                                    <div key={stage.key} className="flex items-center gap-2">
                                      <span className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center font-black select-none text-[9px]
                                        ${isCompleted 
                                          ? 'bg-primary border-solid border-primary text-textDark' 
                                          : 'bg-white border-dashed border-secondary text-mutedGrey'}`}
                                      >
                                        {isCompleted ? '✓' : ''}
                                      </span>
                                      <span className={`
                                        ${isCurrent ? 'text-marigold-saffron font-black animate-pulse' : ''}
                                        ${isCompleted && !isCurrent ? 'text-textDark/60 font-medium line-through' : 'text-textDark'}`}
                                      >
                                        {stage.label} {isCurrent && "• in progress"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {order.status === 'ready' && (
                              <div className="bg-green-50/70 border border-green-200 p-3.5 rounded-xl text-[11px] text-green-800 leading-relaxed font-semibold flex gap-2">
                                <AlertCircle className="w-4.5 h-4.5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  Your order is ready. Present order ID **#{order.id.slice(-6).toUpperCase()}** at the counter to collect it.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-secondary p-8 text-center text-xs font-semibold text-mutedGrey">
                      No active orders cooking.
                    </div>
                  )}
                </div>

                {/* Historic Orders Archive */}
                <div className="space-y-3 pt-4 border-t border-secondary/55">
                  <h4 className="font-poppins font-extrabold text-sm text-textDark">Completed Orders History</h4>
                  
                  {pastOrders.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-secondary shadow-warm-sm divide-y divide-secondary/40 overflow-hidden">
                      {pastOrders.map((order) => (
                        <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="bg-secondary p-2 rounded-lg text-mutedGrey">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <h5 className="font-bold text-textDark font-poppins">
                                {shops.find(s => s.id === order.shop_id)?.name || 'Canteen'}
                              </h5>
                              <p className="text-[10px] text-mutedGrey font-medium mt-0.5">
                                {order.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between sm:justify-end items-center gap-6">
                            <div className="text-right">
                              <span className="text-[10px] text-mutedGrey font-medium block">
                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="font-extrabold text-textDark mt-0.5 block">₹{order.total}</span>
                            </div>
                            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-mutedGrey font-semibold">
                      Your completed order records will compile here.
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ==================== TAB 4: REWARDS STAMPS ==================== */}
            {activeTab === 'rewards' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-secondary/55">
                  <Gift className="w-5 h-5 text-primary-hover" />
                  <h4 className="font-poppins font-black text-sm text-textDark uppercase tracking-wider">Active Stamp Cards</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shops.map((shop) => {
                    const stampCount = progress[shop.id] || 0;
                    
                    const milestone1Unlocked = stampCount >= 5;
                    const milestone2Unlocked = stampCount >= 15;
                    const remainingToTier1 = Math.max(0, 5 - stampCount);
                    const remainingToTier2 = Math.max(0, 15 - stampCount);

                    const percent = Math.min(100, (stampCount / 15) * 100);

                    return (
                      <div key={shop.id} className="bg-white rounded-2xl border border-secondary p-5 shadow-warm-sm space-y-4 relative overflow-hidden flex flex-col justify-between">
                        
                        {/* Card Header */}
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-poppins font-extrabold text-xs text-textDark leading-tight">{shop.name}</h4>
                              <span className="text-[9px] font-bold text-mutedGrey uppercase mt-0.5 block">{shop.category}</span>
                            </div>
                            <span className="bg-[#FAF9F6] border border-secondary text-textDark text-[9px] font-black px-2.5 py-1 rounded-full">
                              {stampCount} Stamp{stampCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="bg-[#FDFBF7] p-4 rounded-2xl border-2 border-dashed border-textDark/25 shadow-inner relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] w-full mt-4">
                            <div className="text-center font-handwritten text-base text-mutedGrey tracking-wide mb-3 select-none">
                              Loyalty card
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2.5 justify-center items-center">
                              {Array.from({ length: 15 }).map((_, slotIdx) => {
                                const isStamped = stampCount > slotIdx;
                                const isMilestone5 = slotIdx === 4;
                                const isMilestone15 = slotIdx === 14;
                                
                                // Hydration-safe deterministic stamp rotations - kept extremely subtle
                                const STAMP_ROTATIONS = [1.5, -2, 1, -1.5, 2.5, -1, 2, -0.5, 1.2, -1.8, 0.8, -1.2, 2.2, -0.6, 1.5];
                                const rotation = STAMP_ROTATIONS[slotIdx % STAMP_ROTATIONS.length];

                                return (
                                  <div 
                                    key={slotIdx}
                                    className={`aspect-square w-10 h-10 rounded-full border-2 border-dashed flex flex-col items-center justify-center relative transition-all duration-300 mx-auto
                                      ${isStamped 
                                        ? 'bg-white border-solid border-[#D9381E]/40 shadow-sm' 
                                        : isMilestone15 
                                          ? 'bg-marigold/10 border-marigold/40 text-marigold-saffron font-black animate-pulse'
                                          : isMilestone5 
                                            ? 'bg-primary/20 border-primary/45 text-textDark font-black'
                                            : 'bg-secondary/15 border-secondary/40 text-mutedGrey'}`}
                                  >
                                    {isStamped ? (
                                      <div 
                                        className="absolute font-handwritten font-black text-[11px] text-[#D9381E] border-2 border-double border-[#D9381E] rounded-full w-8 h-8 flex items-center justify-center bg-white/10 select-none"
                                        style={{ transform: `rotate(${rotation}deg)` }}
                                      >
                                        SNACCIER
                                      </div>
                                    ) : (
                                      <span className="text-[9px] font-black flex flex-col items-center">
                                        <span>{slotIdx + 1}</span>
                                        {isMilestone5 && <span className="text-[5px] font-black text-primary-hover lowercase leading-none mt-0.5">10%</span>}
                                        {isMilestone15 && <span className="text-[5px] font-black text-marigold-saffron lowercase leading-none mt-0.5">20%</span>}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>                  </div>

                        {/* Unlocked/Promo box status */}
                        <div className="space-y-2 pt-3 border-t border-secondary/40 mt-3">
                          {milestone2Unlocked ? (
                            <div className="bg-accent/15 border border-accent/30 p-2.5 rounded-xl text-center space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-accent-hover block">Super VIP Reward Active!</span>
                              <div className="font-extrabold text-[11px] text-textDark">20% Off on next 10 Orders!</div>
                            </div>
                          ) : milestone1Unlocked ? (
                            <div className="space-y-2">
                              <div className="bg-primary/15 border border-primary/30 p-2.5 rounded-xl text-center space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-wider text-primary-hover block">Tier 1 Unlocked!</span>
                                <div className="font-extrabold text-[11px] text-textDark">10% Discount on Next Order!</div>
                              </div>
                              <p className="text-[9px] text-mutedGrey font-bold text-center uppercase tracking-wider">
                                Only {remainingToTier2} more order{remainingToTier2 !== 1 ? 's' : ''} to unlock **20% Off for next 10 orders**!
                              </p>
                            </div>
                          ) : (
                            <p className="text-[9px] text-mutedGrey font-semibold leading-relaxed text-center py-2">
                              Complete <span className="text-textDark font-black">{remainingToTier1} more order{remainingToTier1 !== 1 ? 's' : ''}</span> to get **10% discount** on your next order, and then **20% on the next 10 orders**!
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </div>

      {/* 4. COMPACT FEEDBACK SUGGESTIONS DOCK */}
      <div className="bg-white rounded-2xl border border-secondary p-5 shadow-warm-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 pr-4 md:border-r border-secondary/55 flex-1">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-primary-hover font-black" />
            <h4 className="font-poppins font-extrabold text-sm text-textDark leading-none">Suggestions & Feedback</h4>
          </div>
          <p className="text-[10px] text-mutedGrey leading-relaxed font-semibold">
            Have suggestions or ran into any issues? Let us know at **swastiivv.22@gmail.com**.
          </p>
        </div>

        {formSuccess ? (
          <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-green-700 text-[10px] font-bold flex gap-1.5 animate-fade-in leading-relaxed flex-1">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 mt-0.5" />
            <span>Opened email draft. Thank you!</span>
          </div>
        ) : (
          <form onSubmit={handleGrievanceSubmit} className="flex gap-2 w-full md:w-auto flex-1">
            <input
              type="text"
              value={grievance}
              onChange={(e) => setGrievance(e.target.value)}
              placeholder="Suggest improvements or report issues..."
              className="flex-grow border border-secondary rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary bg-[#FAF9F6] font-semibold text-textDark"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-textDark font-extrabold rounded-xl text-xs shadow-sm transition-bounce flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

// ============================================================================
// SHOP OPERATIONS DASHBOARD: ORIGINAL VENDOR TERMINAL (BACKWARDS COMPATIBILITY)
// ============================================================================
function ShopOperatorDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const router = useRouter();

  const playOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5 chime
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const ordersRef = useRef([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    let isInitial = true;
    const unsubscribe = subscribeToOrdersList(user.shopId, null, (ordersList) => {
      if (!isInitial && chimeEnabled) {
        // Find if there is a new placed order
        const hasNewPlaced = ordersList.some(
          newO => newO.status === 'placed' && !ordersRef.current.some(oldO => oldO.id === newO.id)
        );
        if (hasNewPlaced) {
          playOrderChime();
        }
      }
      isInitial = false;
      setOrders(ordersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.shopId, chimeEnabled]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading operator workspace..." />
      </div>
    );
  }

  const placedOrders = orders.filter(o => o.status === 'placed');
  const preparingOrders = orders.filter(o => o.status === 'accepted' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed').slice(0, 10);

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-6">
      
      {/* CONTROL TOP BAR */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="bg-textDark text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {user.name} Terminal
          </span>
          <h1 className="font-poppins text-3xl font-extrabold text-textDark tracking-tight mt-2">
            Operations Console
          </h1>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setChimeEnabled(!chimeEnabled)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm border flex items-center gap-2 transition-all
              ${chimeEnabled 
                ? 'bg-white border-secondary text-textDark hover:bg-secondary/20' 
                : 'bg-red-50 border-red-200 text-red-600'}`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Chime: {chimeEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
          
          <button 
            onClick={() => router.push('/controls')}
            className="px-4 py-2.5 bg-primary text-textDark font-bold rounded-xl text-xs shadow-sm hover:shadow-warm-md transition-all"
          >
            Canteen Settings
          </button>
        </div>
      </div>

      {/* COLUMNS LAYOUT CONTAINER */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        
        {/* 1. NEW ORDERS */}
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-amber-800 uppercase tracking-wide font-poppins">New Tickets</h3>
            <span className="bg-amber-200 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
              {placedOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {placedOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-warm-md space-y-4 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 animate-pulse" />

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5">
                        <User className="w-4 h-4 text-mutedGrey" />
                        {order.student_name}
                      </h4>
                      <span className="text-[10px] text-mutedGrey font-bold uppercase tracking-wider">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="text-xs font-extrabold text-textDark">₹{order.total}</span>
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-xl border border-secondary text-xs pl-2">
                    <ul className="space-y-1.5 font-semibold text-textDark">
                      {order.items.map((i, itemIdx) => (
                        <li key={itemIdx} className="flex justify-between">
                          <span>{i.name}</span>
                          <span className="text-mutedGrey">x{i.qty}</span>
                        </li>
                      ))}
                    </ul>
                    {order.notes && (
                      <div className="mt-3 pt-3 border-t border-secondary/50 text-[10px] text-red-600 flex items-start gap-1 font-bold">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Notes: “{order.notes}”</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleStatusChange(order.id, 'accepted')}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 hover:shadow-sm text-textDark text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" /> Accept Ticket
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {placedOrders.length === 0 && (
              <div className="text-center py-8 text-mutedGrey text-xs font-semibold">No new orders yet.</div>
            )}
          </div>
        </div>

        {/* 2. PREPARING */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-blue-800 uppercase tracking-wide font-poppins">Cooking</h3>
            <span className="bg-blue-200 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {preparingOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white border border-secondary rounded-2xl p-5 shadow-warm-sm space-y-4 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5">
                        <User className="w-4 h-4 text-mutedGrey" />
                        {order.student_name}
                      </h4>
                      <span className="text-[10px] text-mutedGrey font-bold uppercase tracking-wider">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="text-xs font-extrabold text-textDark">₹{order.total}</span>
                  </div>

                  <div className="bg-secondary/20 p-3 rounded-xl border border-secondary/60 text-xs">
                    <ul className="space-y-1.5 font-semibold text-textDark">
                      {order.items.map((i, itemIdx) => (
                        <li key={itemIdx} className="flex justify-between">
                          <span>{i.name}</span>
                          <span className="text-mutedGrey">x{i.qty}</span>
                        </li>
                      ))}
                    </ul>
                    {order.notes && (
                      <div className="mt-3 pt-3 border-t border-secondary/50 text-[10px] text-red-600 flex items-start gap-1 font-bold">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Notes: “{order.notes}”</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'accepted' ? (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-4 h-4 fill-current" /> Start Preparing
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Ready for Pickup
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {preparingOrders.length === 0 && (
              <div className="text-center py-8 text-mutedGrey text-xs font-semibold">Canteen burner is idle.</div>
            )}
          </div>
        </div>

        {/* 3. READY FOR PICKUP */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200/80 p-4 rounded-2xl flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-green-800 uppercase tracking-wide font-poppins">Ready for Pickup</h3>
            <span className="bg-green-200 text-green-800 text-xs font-black px-2.5 py-1 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {readyOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white border-green-300 rounded-2xl p-5 shadow-warm-md space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-xl -z-10" />

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5">
                        <User className="w-4 h-4 text-mutedGrey" />
                        {order.student_name}
                      </h4>
                      <span className="text-[10px] text-mutedGrey font-bold uppercase tracking-wider">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="text-xs font-extrabold text-textDark">₹{order.total}</span>
                  </div>

                  <div className="bg-green-50/50 p-3 rounded-xl border border-green-200 text-xs">
                    <ul className="space-y-1.5 font-semibold text-textDark">
                      {order.items.map((i, itemIdx) => (
                        <li key={itemIdx} className="flex justify-between">
                          <span>{i.name}</span>
                          <span className="text-mutedGrey">x{i.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleStatusChange(order.id, 'completed')}
                    className="w-full py-3 bg-textDark hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Hand Over & Pay
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {readyOrders.length === 0 && (
              <div className="text-center py-8 text-mutedGrey text-xs font-semibold">No ready parcels.</div>
            )}
          </div>
        </div>

        {/* 4. COMPLETED ORDERS (HISTORIC) */}
        <div className="space-y-4">
          <div className="bg-secondary/40 border border-secondary p-4 rounded-2xl flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-mutedGrey uppercase tracking-wide font-poppins">Completed Today</h3>
            <span className="bg-secondary text-textDark text-xs font-black px-2.5 py-1 rounded-full">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {completedOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-secondary/50 p-4 rounded-2xl text-xs space-y-1 opacity-70"
                >
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-textDark">{order.student_name}</h5>
                    <span className="font-extrabold text-textDark">₹{order.total}</span>
                  </div>
                  <p className="text-[10px] text-mutedGrey truncate">
                    {order.items.map(i => `${i.name} x${i.qty}`).join(', ')}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-secondary/30 mt-2 text-[9px] text-mutedGrey">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Completed</span>
                    <span>{new Date(order.updated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {completedOrders.length === 0 && (
              <div className="text-center py-8 text-mutedGrey text-xs font-semibold">No tickets closed today.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MAIN UNIFIED DASHBOARD CONTAINER ROUTE
// ============================================================================
export default function UnifiedDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=dashboard');
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDFB] flex flex-col justify-center items-center">
        <Loader message="Loading dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Branch dashboards role reactively
  if (user.type === 'shop') {
    return <ShopOperatorDashboard user={user} />;
  }

  return <StudentDashboard user={user} />;
}
