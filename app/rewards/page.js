// app/rewards/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getShops, getRewardsProgress } from '@/lib/db';
import { Gift, Star, RefreshCw, Award, Lock, CheckCircle2, Ticket, Sparkles, Navigation, Wallet, ShieldCheck, ArrowRight, Hourglass, CreditCard, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '@/components/Loader';

export default function RewardsPage() {
  const { user, loading: authLoading } = useAuth();
  const [shops, setShops] = useState([]);
  const [progress, setProgress] = useState({}); // { shopId: count }
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#FF9933', '#D9C7F7', '#FFFDFB', '#2B2730', '#F3B6C6']
      });
    } catch (e) {}
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=rewards');
      return;
    }

    const fetchRewardsData = async () => {
      try {
        const loadedShops = await getShops();
        setShops(loadedShops);

        const progressMap = {};
        for (const shop of loadedShops) {
          const count = await getRewardsProgress(user.id, shop.id);
          progressMap[shop.id] = count || 0;
        }
        setProgress(progressMap);

        // Throw confetti if any milestone is freshly unlocked
        const hasUnlockedMilestone = Object.values(progressMap).some(count => count === 5 || count === 15);
        if (hasUnlockedMilestone) {
          triggerConfetti();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading rewards tally..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-6xl mx-auto space-y-12">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <div className="bg-marigold/10 p-3 rounded-2xl text-marigold shadow-sm border border-marigold/20">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-textDark tracking-tight">SNACCIER Club</h1>
          <p className="text-mutedGrey text-xs font-semibold uppercase tracking-wider mt-0.5">Order food, unlock canteen rewards</p>
        </div>
      </div>

      {/* CORE LOYALTY CARDS & MILESTONES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PROGRESSIVE MILESTONES MAP */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="font-extrabold text-base text-textDark font-poppins px-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
            <span>Active Canteen Stamp Cards</span>
          </h2>
          
          <div className="space-y-6">
            {shops.map((shop) => {
              const count = progress[shop.id] || 0;
              const hasMilestone1 = count >= 5;
              const hasMilestone2 = count >= 15;
              
              // Calculate percent progress toward final tier (15 orders)
              const percent = Math.min(100, (count / 15) * 100);

              return (
                <div key={shop.id} className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-6 relative overflow-hidden">
                  
                  {/* Backdrop accents */}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-marigold/5 rounded-full blur-2xl -z-10" />

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-secondary">
                        <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-textDark font-poppins">{shop.name}</h3>
                        <p className="text-[10px] text-mutedGrey font-medium mt-0.5">{shop.category}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-mutedGrey font-bold uppercase block leading-none">Completed</span>
                      <span className="font-extrabold text-xl text-marigold font-poppins block mt-1">
                        {count} Stamp{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Handcrafted wobbly paper loyalty card layout */}
                  <div className="bg-[#FDFBF7] p-5 rounded-3xl border-2 border-dashed border-textDark/25 shadow-inner relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] max-w-md mx-auto w-full">
                    <div className="text-center font-handwritten text-base text-mutedGrey tracking-wide mb-4 select-none">
                      Loyalty card
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3 justify-center items-center">
                      {Array.from({ length: 15 }).map((_, slotIdx) => {
                        const isStamped = count > slotIdx;
                        const isMilestone5 = slotIdx === 4;
                        const isMilestone15 = slotIdx === 14;
                        
                        // Hydration-safe deterministic stamp rotations - kept extremely subtle
                        const STAMP_ROTATIONS = [1.5, -2, 1, -1.5, 2.5, -1, 2, -0.5, 1.2, -1.8, 0.8, -1.2, 2.2, -0.6, 1.5];
                        const rotation = STAMP_ROTATIONS[slotIdx % STAMP_ROTATIONS.length];

                        return (
                          <div 
                            key={slotIdx}
                            className={`aspect-square w-12 h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center relative transition-all duration-300 mx-auto
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
                                className="absolute font-handwritten font-black text-sm text-[#D9381E] border-2 border-double border-[#D9381E] rounded-full w-10 h-10 flex items-center justify-center bg-white/10 select-none"
                                style={{ transform: `rotate(${rotation}deg)` }}
                              >
                                SNACCIER
                              </div>
                            ) : (
                              <span className="text-[10px] font-black flex flex-col items-center">
                                <span>{slotIdx + 1}</span>
                                {isMilestone5 && <span className="text-[6px] font-black text-primary-hover lowercase leading-none mt-0.5">10%</span>}
                                {isMilestone15 && <span className="text-[6px] font-black text-marigold-saffron lowercase leading-none mt-0.5">20%</span>}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTIVE REWARD CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-secondary/40">
                    
                    {/* 10% COUPON */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between h-32 transition-all duration-300
                      ${hasMilestone1 
                        ? 'bg-primary/10 border-primary/40 shadow-sm' 
                        : 'bg-secondary/10 border-secondary/50 opacity-60'}`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-textDark">Milestone Tier 1</span>
                          {hasMilestone1 ? (
                            <span className="bg-primary text-textDark text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Unlocked</span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-mutedGrey" />
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-textDark mt-1">10% Off Next Order</h4>
                      </div>
                      {hasMilestone1 ? (
                        <div className="bg-primary/20 border border-primary/40 p-2 rounded-lg text-center text-[10px] font-black text-textDark uppercase tracking-wider">
                          Discount Active!
                        </div>
                      ) : (
                        <span className="text-[9px] text-mutedGrey font-semibold">Complete {5 - count} more orders to unlock.</span>
                      )}
                    </div>

                    {/* 20% COUPON */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between h-32 transition-all duration-300
                      ${hasMilestone2 
                        ? 'bg-marigold/10 border-marigold/40 shadow-sm' 
                        : 'bg-secondary/10 border-secondary/50 opacity-60'}`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-textDark">Milestone Tier 2</span>
                          {hasMilestone2 ? (
                            <span className="bg-marigold text-textDark text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Unlocked</span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-mutedGrey" />
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-textDark mt-1">20% Off Next 10 Orders</h4>
                      </div>
                      {hasMilestone2 ? (
                        <div className="bg-marigold/20 border border-marigold/40 p-2 rounded-lg text-center text-[10px] font-black text-textDark uppercase tracking-wider">
                          Discount Active!
                        </div>
                      ) : (
                        <span className="text-[9px] text-mutedGrey font-semibold">Complete {15 - count} more orders to unlock.</span>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* 2. ADVANTAGES & ROADMAP COLUMN */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* ADVANTAGES LIST */}
          <div className="bg-white rounded-2xl border border-secondary p-6 shadow-warm-sm space-y-4">
            <h3 className="font-extrabold text-xs uppercase text-mutedGrey tracking-wider font-poppins pb-2 border-b border-secondary/40 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-marigold" />
              <span>Campus Club Perks</span>
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 text-xs leading-relaxed font-semibold">
                <span className="text-marigold text-base flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-textDark text-xs">Direct UPI & Cash Pickup</h4>
                  <p className="text-[10px] text-mutedGrey mt-0.5">Pay at the counter when you pick up. Settle physically with QR code or cash.</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs leading-relaxed font-semibold">
                <span className="text-marigold text-base flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-textDark text-xs uppercase">Order During Lectures, Pick Up on Break</h4>
                  <p className="text-[10px] text-mutedGrey mt-0.5">Place orders during back-to-back labs. Your food stays warm and ready for you.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FUTURE ROADMAP */}
          <div className="bg-textDark text-white rounded-2xl p-6 shadow-warm-lg space-y-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-marigold/10 rounded-full blur-xl -z-10" />
            
            <h3 className="font-extrabold text-xs uppercase text-marigold tracking-wider font-poppins pb-2 border-b border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-marigold" />
              <span>Campus updates in progress</span>
            </h3>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-marigold" /> Hostel Delivery Squad
                  </h4>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                  We are exploring a Delivery Squad model where students who are walking back to hostels can pick up and deliver orders to their peers along the way.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-accent" /> Cashless Checkout
                  </h4>
                  <span className="bg-accent text-textDark text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Planning</span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                  We are working on adding secure UPI and cashless integration directly on checkout, so you can pay digitally before you arrive.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
