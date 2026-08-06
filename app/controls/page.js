// app/controls/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getShopById, updateShopStatus, updateMenuItemStatus } from '@/lib/db';
import { Store, Clock, ToggleLeft, ToggleRight, ArrowLeft, RefreshCw, AlertTriangle, Coffee, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '@/components/Loader';

export default function ShopControls() {
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [customEta, setCustomEta] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [feedback, setFeedback] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    // Redirect if not shop owner
    if (!user || user.type !== 'shop') {
      router.push('/shop-access');
      return;
    }

    const fetchShopAndMenu = async () => {
      try {
        const data = await getShopById(user.shopId);
        setShop(data);
        setCustomEta(data.eta);
        if (data.eta && !['5 mins', '10 mins', '15 mins', '20 mins', '30 mins'].includes(data.eta)) {
          setShowCustomInput(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndMenu();
  }, [user, authLoading]);

  const handleToggleShopOpen = async () => {
    if (!shop || updating) return;
    setUpdating(true);
    setFeedback('');
    
    const nextStatus = !shop.is_open;
    const nextEta = nextStatus ? '10 mins' : 'Closed';
    
    try {
      const success = await updateShopStatus(shop.id, nextStatus, nextEta);
      if (success) {
        setShop(prev => ({ ...prev, is_open: nextStatus, eta: nextEta }));
        setCustomEta(nextEta);
        triggerSuccessFeedback("Shop status updated successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateEta = async (newEta = customEta) => {
    if (!shop || updating) return;
    setUpdating(true);
    setFeedback('');

    try {
      const success = await updateShopStatus(shop.id, shop.is_open, newEta);
      if (success) {
        setShop(prev => ({ ...prev, eta: newEta }));
        setCustomEta(newEta);
        triggerSuccessFeedback(`Estimated wait time set to: ${newEta}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMenuItemSoldOut = async (itemId, currentSoldOut) => {
    if (!shop || updating) return;
    setFeedback('');

    try {
      const success = await updateMenuItemStatus(itemId, !currentSoldOut);
      if (success) {
        setShop(prev => ({
          ...prev,
          menu: prev.menu.map(item => item.id === itemId ? { ...item, sold_out: !currentSoldOut } : item)
        }));
        triggerSuccessFeedback("Menu item availability updated!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSuccessFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  if (authLoading || loading || !user || !shop) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading control board..." />
      </div>
    );
  }

  const etaPresets = ['5 mins', '10 mins', '15 mins', '20 mins', '30 mins'];
  const isCustomActive = shop.is_open && shop.eta && !etaPresets.includes(shop.eta);

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-6 py-12 max-w-4xl mx-auto">
      
      {/* HEADER TOP ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-3 bg-white border border-secondary hover:bg-secondary/40 text-textDark rounded-2xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="bg-primary/50 text-textDark px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {shop.name}
            </span>
            <h1 className="font-poppins text-3xl font-extrabold text-textDark tracking-tight mt-1">Canteen Controls</h1>
          </div>
        </div>

        <button 
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-white hover:bg-secondary/40 border border-secondary text-textDark text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          View Orders Board
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-700 text-xs font-bold mb-6 flex items-center gap-2 shadow-sm"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{feedback}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SHOP STATUS AND ETAS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* OPEN / CLOSED TOGGLE */}
          <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-4">
            <h3 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5 pb-3 border-b border-secondary/45">
              <Store className="w-4.5 h-4.5 text-mutedGrey" />
              <span>Operational Status</span>
            </h3>

            <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-xl border border-secondary/55">
              <div>
                <span className="text-xs font-bold text-textDark block">Canteen Ordering</span>
                <span className="text-[10px] text-mutedGrey mt-0.5 block">Toggle to stop incoming orders</span>
              </div>
              <div className="love relative flex items-center justify-center w-12 h-12 mr-4">
                <input 
                  id="switch" 
                  type="checkbox"
                  checked={shop.is_open}
                  onChange={handleToggleShopOpen}
                  disabled={updating}
                  className="sr-only"
                />
                <label className="love-heart" htmlFor="switch">
                  <i className="left"></i>
                  <i className="right"></i>
                  <i className="bottom"></i>
                  <div className="round"></div>
                </label>
              </div>
            </div>
          </div>

          {/* WAIT TIMERS (ETAs) */}
          {shop.is_open && (
            <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-6">
              <h3 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5 pb-3 border-b border-secondary/45">
                <Clock className="w-4.5 h-4.5 text-mutedGrey" />
                <span>Estimated Wait (ETA)</span>
              </h3>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {etaPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowCustomInput(false);
                      handleUpdateEta(preset);
                    }}
                    className={`py-2 px-3 border rounded-xl text-[10px] font-bold shadow-sm transition-all
                      ${shop.eta === preset && !showCustomInput
                        ? 'bg-primary border-primary/20 text-textDark font-black' 
                        : 'bg-white border-secondary text-mutedGrey hover:bg-secondary/20'}`}
                  >
                    {preset}
                  </button>
                ))}

                {/* Custom Button Toggle */}
                <button
                  onClick={() => setShowCustomInput(prev => !prev)}
                  className={`py-2 px-3 border rounded-xl text-[10px] font-bold shadow-sm transition-all
                    ${isCustomActive || showCustomInput
                      ? 'bg-primary border-primary/20 text-textDark font-black' 
                      : 'bg-white border-secondary text-mutedGrey hover:bg-secondary/20'}`}
                >
                  Custom
                </button>
              </div>

              {/* Custom input */}
              {(showCustomInput || isCustomActive) && (
                <div className="space-y-2 pt-4 border-t border-[#E5E4E2] transition-all">
                  <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Custom Wait Interval</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEta}
                      onChange={e => setCustomEta(e.target.value)}
                      placeholder="E.g. '12 mins'"
                      className="flex-1 border border-secondary rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-background font-medium"
                    />
                    <button
                      onClick={() => handleUpdateEta()}
                      className="bg-textDark hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MENU OVERRIDES (SOLD OUT TOGGLES) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-4">
            <h3 className="font-extrabold text-sm text-textDark font-poppins flex items-center gap-1.5 pb-2 border-b border-secondary/45">
              <Coffee className="w-4.5 h-4.5 text-mutedGrey" />
              <span>Menu Item Availability</span>
            </h3>

            {shop.menu.length === 0 ? (
              <div className="text-center py-6 text-xs text-mutedGrey">This shop has no menu items preloaded.</div>
            ) : (
              <div className="divide-y divide-secondary/40">
                {shop.menu.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between items-center gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className={`font-bold text-textDark ${item.sold_out ? 'text-mutedGrey line-through' : ''}`}>
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[10px] text-mutedGrey mt-0.5 block">Price: ₹{item.price}</span>
                    </div>

                    {/* Toggle button */}
                    <button 
                      onClick={() => handleToggleMenuItemSoldOut(item.id, item.sold_out)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all border
                        ${item.sold_out 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50'}`}
                    >
                      {item.sold_out ? "Mark Available" : "Mark Sold Out"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
