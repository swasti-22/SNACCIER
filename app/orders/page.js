// app/orders/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getOrdersByStudent, subscribeToOrders } from '@/lib/db';
import { Clock, CheckCircle2, ShoppingBag, CreditCard, ChevronRight, Store, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '@/components/Loader';

export default function OrderTrackingPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const loaded = await getOrdersByStudent(user.id);
        setOrders(loaded);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to realtime order updates for this student
    const unsubscribe = subscribeToOrders(null, user.id, (updatedOrder) => {
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === updatedOrder.id);
        if (index > -1) {
          // Replace matching order
          const updated = [...prev];
          updated[index] = updatedOrder;
          return updated;
        } else {
          // Insert new order at top
          return [updatedOrder, ...prev];
        }
      });
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Syncing order timeline..." />
      </div>
    );
  }

  // Segment orders into active tracking vs. past history
  const activeOrders = orders.filter(o => o.status !== 'completed');
  const pastOrders = orders.filter(o => o.status === 'completed');

  const STAGES = [
    { key: 'placed', label: 'Order Placed', desc: 'Sent to canteen counter' },
    { key: 'accepted', label: 'Accepted', desc: 'Bhaya acknowledged' },
    { key: 'preparing', label: 'Preparing', desc: 'Maggi/coffee cooking' },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Hot & ready at desk' }
  ];

  const getStageIndex = (status) => {
    if (status === 'completed') return 4;
    return STAGES.findIndex(s => s.key === status);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-4xl mx-auto">
      
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-textDark tracking-tight">Track Cravings</h1>
          <p className="text-mutedGrey text-xs font-semibold uppercase tracking-wider mt-0.5">Realtime order pipeline</p>
        </div>
        <button 
          onClick={() => router.push('/shops')}
          className="bg-white border border-secondary hover:bg-secondary/40 text-textDark px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
        >
          Order More
        </button>
      </div>

      {activeOrders.length === 0 && pastOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-secondary p-12 text-center shadow-warm-sm">
          <Clock className="w-16 h-16 text-mutedGrey mx-auto mb-4" />
          <h3 className="font-bold text-xl text-textDark">No orders placed yet</h3>
          <p className="text-sm text-mutedGrey mt-2 mb-6">You haven&apos;t ordered anything yet today. Go see what SMOOZ is blending!</p>
          <button 
            onClick={() => router.push('/shops')}
            className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-textDark font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Browse Shops
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* ACTIVE ORDERS REALTIME TRACKER */}
          {activeOrders.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-extrabold text-xl text-textDark font-poppins px-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Active Trackers</span>
              </h2>

              <div className="space-y-8">
                {activeOrders.map((order) => {
                  const activeIdx = getStageIndex(order.status);
                  return (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-2xl border border-secondary p-6 md:p-8 shadow-warm-md space-y-8"
                    >
                      {/* Shop header and bill meta */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-secondary/40">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/30 p-2.5 rounded-xl text-textDark">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-textDark font-poppins">{order.shop_id === 'shop_smooz' ? 'SMOOZ Canteen' : order.shop_id === 'shop_bites' ? 'Campus Bites' : 'Crave Bakery'}</h3>
                            <p className="text-[10px] text-mutedGrey font-semibold uppercase mt-0.5">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] text-mutedGrey font-bold uppercase leading-none">Total Bill</div>
                            <div className="text-base font-extrabold text-textDark mt-0.5">₹{order.total}</div>
                          </div>
                          <span className="px-3 py-1 bg-accent/50 text-textDark text-[10px] font-bold rounded-full uppercase tracking-wide animate-pulse">
                            Pay on Pickup
                          </span>
                        </div>
                      </div>

                      {/* STAGE PIPELINE */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {STAGES.map((stage, idx) => {
                          const isDone = idx < activeIdx;
                          const isCurrent = idx === activeIdx;
                          const isPending = idx > activeIdx;

                          return (
                            <div key={stage.key} className="flex md:flex-col items-center md:items-center text-center gap-4 md:gap-3 relative z-10">
                              {/* Step circle */}
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border transition-all duration-500
                                ${isDone ? 'bg-primary border-primary/20 text-textDark' : ''}
                                ${isCurrent ? 'bg-accent border-accent/20 text-textDark font-black ring-4 ring-accent/20 animate-pulse' : ''}
                                ${isPending ? 'bg-secondary/70 border-secondary text-mutedGrey' : ''}`}>
                                {isDone ? <CheckCircle2 className="w-5 h-5 text-textDark" /> : idx + 1}
                              </div>

                              {/* Stage labels */}
                              <div className="text-left md:text-center">
                                <h4 className={`text-xs font-extrabold transition-colors duration-500
                                  ${isCurrent ? 'text-textDark font-black text-sm' : 'text-mutedGrey'}
                                  ${isDone ? 'text-textDark font-bold' : ''}`}>
                                  {stage.label}
                                </h4>
                                <p className="text-[10px] text-mutedGrey mt-0.5 leading-tight">{stage.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ready for pickup helper box */}
                      {order.status === 'ready' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 p-4 rounded-xl border border-green-200 flex gap-3 text-xs text-green-800 leading-relaxed font-semibold"
                        >
                          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            Your snacks are hot and packaged! Skip the queue, head straight to the pickup desk, verify your order ID (**#{order.id.slice(-6).toUpperCase()}**), pay Bhaiya via cash/UPI QR code, and enjoy your meal!
                          </div>
                        </motion.div>
                      )}

                      {/* Order items lists recap */}
                      <div className="bg-secondary/20 p-4 rounded-2xl border border-secondary/60">
                        <span className="font-bold text-[10px] uppercase text-mutedGrey tracking-wider block mb-3 px-1">Order Details</span>
                        <div className="space-y-2">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between items-center text-xs text-textDark">
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{item.name} <span className="text-mutedGrey font-bold">x {item.qty}</span></span>
                              </div>
                              <span className="font-bold">₹{item.price * item.qty}</span>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="mt-3 pt-3 border-t border-secondary/35 text-[11px] text-mutedGrey font-medium flex gap-1.5">
                              <MessageSquare className="w-4 h-4 text-textDark flex-shrink-0" />
                              <span>Instruction: “{order.notes}”</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HISTORIC ORDERS LIST */}
          {pastOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-extrabold text-lg text-textDark font-poppins px-2">Order History</h2>
              <div className="bg-white rounded-2xl border border-secondary shadow-warm-sm divide-y divide-secondary/40 overflow-hidden">
                {pastOrders.map((order) => (
                  <div key={order.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary p-2 rounded-lg text-mutedGrey">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-textDark font-poppins">{order.shop_id === 'shop_smooz' ? 'SMOOZ Canteen' : order.shop_id === 'shop_bites' ? 'Campus Bites' : 'Crave Bakery'}</h4>
                        <p className="text-[10px] text-mutedGrey font-medium mt-0.5">
                          {order.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between sm:justify-end items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-mutedGrey font-medium block">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-extrabold text-textDark mt-0.5 block">₹{order.total}</span>
                      </div>
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wide">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
