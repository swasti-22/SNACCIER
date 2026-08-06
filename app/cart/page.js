// app/cart/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { placeOrder, getShops } from '@/lib/db';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Info, Store, RefreshCw, MessageSquare } from 'lucide-react';
import Loader from '@/components/Loader';

export default function CartPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Read cart elements
    try {
      const items = JSON.parse(localStorage.getItem("snaccier_cart") || "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCart = (updatedItems) => {
    setCartItems(updatedItems);
    localStorage.setItem("snaccier_cart", JSON.stringify(updatedItems));
    window.dispatchEvent(new Event("snaccier_cart")); // Fire global Navbar notifier
  };

  const handleQuantityChange = async (itemId, shopId, change) => {
    if (change > 0) {
      try {
        const shops = await getShops();
        const shop = shops.find(s => s.id === shopId);
        if (shop && (shop.is_open === false || shop.is_open === 'false')) {
          alert("This canteen is currently closed. Please check back later.");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const updated = cartItems.map(item => {
      if (item.id === itemId && item.shopId === shopId) {
        const nextQty = Math.max(0, item.qty + change);
        return { ...item, qty: nextQty };
      }
      return item;
    }).filter(item => item.qty > 0); // Purge items with 0 quantities
    updateCart(updated);
  };

  const handleRemoveItem = (itemId, shopId) => {
    const updated = cartItems.filter(item => !(item.id === itemId && item.shopId === shopId));
    updateCart(updated);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleCheckout = async () => {
    if (!user) {
      // Redirect to login first
      router.push('/login?redirect=cart');
      return;
    }

    if (cartItems.length === 0) return;
    setCheckingOut(true);

    try {
      const shops = await getShops();
      const shopsInCart = [...new Set(cartItems.map(item => item.shopId))];
      
      for (const shopId of shopsInCart) {
        const shop = shops.find(s => s.id === shopId);
        if (shop && (shop.is_open === false || shop.is_open === 'false')) {
          alert("This canteen is currently closed. Please check back later.");
          setCheckingOut(false);
          return;
        }
      }
      
      for (const shopId of shopsInCart) {
        const shopItems = cartItems.filter(i => i.shopId === shopId);
        const subtotal = shopItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        await placeOrder(
          user.id,
          user.name || 'Anonymous Student',
          shopId,
          shopItems,
          notes,
          subtotal,
          subtotal // Zero fee, subtotal = total
        );
      }

      // Clear local cart
      updateCart([]);
      setNotes('');
      
      // Redirect to tracking page
      router.push('/orders');
    } catch (e) {
      console.error(e);
      alert("Error placing order. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading cart details..." />
      </div>
    );
  }

  // Group cart items by shop name for beautiful canteen separation
  const groupedCart = {};
  cartItems.forEach(item => {
    if (!groupedCart[item.shopName]) {
      groupedCart[item.shopName] = [];
    }
    groupedCart[item.shopName].push(item);
  });

  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-primary/90 p-3 rounded-2xl text-textDark shadow-sm">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-textDark tracking-tight">Your Cart</h1>
          <p className="text-mutedGrey text-xs font-semibold uppercase tracking-wider mt-0.5">Pay physically on pickup</p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-secondary p-12 text-center shadow-warm-sm">
          <ShoppingCart className="w-16 h-16 text-mutedGrey mx-auto mb-4 animate-bounce" />
          <h3 className="font-bold text-xl text-textDark">Your cart is empty</h3>
          <p className="text-sm text-mutedGrey mt-2 mb-6">Head over to the shops and add some meals or coffee!</p>
          <button 
            onClick={() => router.push('/shops')}
            className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-textDark font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Browse Canteens
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CART ITEMS CONTAINER */}
          <div className="lg:col-span-8 space-y-6">
            {Object.keys(groupedCart).map((shopName, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-secondary shadow-warm-sm overflow-hidden">
                {/* Shop group header */}
                <div className="bg-secondary/40 px-6 py-4 border-b border-secondary/60 flex items-center gap-2">
                  <Store className="w-4 h-4 text-textDark" />
                  <span className="font-extrabold text-sm text-textDark font-poppins">{shopName} Order</span>
                </div>

                {/* Items in this shop */}
                <div className="divide-y divide-secondary/40 px-6">
                  {groupedCart[shopName].map((item) => (
                    <div key={item.id} className="py-4 flex justify-between items-center gap-4">
                      {/* Meta details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                          <h4 className="font-bold text-sm text-textDark truncate leading-tight">{item.name}</h4>
                        </div>
                        <span className="text-[11px] font-semibold text-mutedGrey mt-1 block">₹{item.price} each</span>
                      </div>

                      {/* Quantity editors */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-secondary/70 rounded-xl p-1 border border-secondary">
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.shopId, -1)}
                            className="p-1 rounded-lg hover:bg-white text-textDark transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-textDark min-w-5 text-center">{item.qty}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.shopId, 1)}
                            className="p-1 rounded-lg hover:bg-white text-textDark transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove trash button */}
                        <button 
                          onClick={() => handleRemoveItem(item.id, item.shopId)}
                          className="p-2 text-mutedGrey hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ORDER NOTES */}
            <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-3">
              <label className="font-bold text-xs uppercase text-mutedGrey tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Special Instructions for Canteen</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g. 'Make Maggi extra spicy', 'No sugar in smoothie', 'Bring plates'..."
                className="w-full border border-secondary rounded-xl p-4 text-xs focus:outline-none focus:border-primary bg-background h-24 resize-none"
              />
            </div>
          </div>

          {/* CHECKOUT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-6">
              <h3 className="font-extrabold text-lg text-textDark font-poppins pb-3 border-b border-secondary/40">
                Order Summary
              </h3>

              {/* Fee Breakdown */}
              <div className="space-y-3 text-xs font-medium text-mutedGrey">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="text-textDark font-bold">₹{subtotal}</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-secondary/40 flex justify-between items-center font-poppins">
                <span className="font-extrabold text-sm text-textDark">To Pay</span>
                <span className="font-extrabold text-2xl text-textDark">₹{subtotal}</span>
              </div>

              {/* Info alert block */}
              <div className="bg-secondary/40 p-4 rounded-xl border border-secondary/60 text-[10px] text-mutedGrey font-semibold leading-relaxed flex gap-2">
                <Info className="w-4 h-4 text-textDark flex-shrink-0" />
                <div>
                  No online payment is captured now. Show your ready order notification at the counter and pay physically using **Cash or UPI QR Code**.
                </div>
              </div>

              {/* Checkout submit button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-textDark font-extrabold rounded-xl text-xs shadow-sm hover:shadow-warm-md transition-bounce flex items-center justify-center gap-1.5"
              >
                {checkingOut ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Confirm & Place Order <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
