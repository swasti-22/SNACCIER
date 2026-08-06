// app/shops/page.js
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getShops, subscribeToShops } from '@/lib/db';
import { Store, Clock, ArrowRight, Zap, RefreshCw, ChevronRight, Flame } from 'lucide-react';
import Loader from '@/components/Loader';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const loadedShops = await getShops();
        setShops(loadedShops);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();

    // Subscribe to shop status updates in realtime
    const unsubscribe = subscribeToShops((updatedShops) => {
      if (Array.isArray(updatedShops)) {
        setShops(updatedShops);
      } else {
        // If single shop updated
        setShops(prev => prev.map(s => s.id === updatedShops.id ? updatedShops : s));
      }
    });

    return () => unsubscribe();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading campus canteens..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative">
        
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-marigold-saffron uppercase tracking-wider mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>Campus Food Hub</span>
          </div>
          <h1 className="font-poppins text-3xl md:text-5xl font-extrabold text-textDark tracking-tight leading-none font-poppins">
            Order From Your Canteen
          </h1>
          <p className="text-mutedGrey text-sm md:text-base font-semibold mt-2">
            Browse active canteen menus and pick up when Bhaiya notifies you.
          </p>
        </div>

        {/* Live operational counters */}
        <div className="flex gap-4 rotate-[0.5deg]">
          <div className="bg-white px-5 py-4 rounded-3xl border border-secondary shadow-warm-sm flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-mutedGrey font-black uppercase tracking-wider leading-none">Canteens Online</div>
              <div className="text-sm font-extrabold text-textDark mt-1">
                {shops.filter(s => s.is_open).length} / {shops.length} Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHOPS GRID */}
      {shops.length === 0 ? (
        <div className="bg-white p-12 rounded-[28px] text-center border border-secondary shadow-sm max-w-md mx-auto">
          <Store className="w-12 h-12 text-mutedGrey mx-auto mb-4 animate-bounce" />
          <h3 className="font-bold text-lg text-textDark">No shops loaded yet</h3>
          <p className="text-xs text-mutedGrey mt-1">Admin will preload the canteens shortly.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch"
        >
          {shops.map((shop, idx) => {
            const subtleRotations = ["rotate-[-0.3deg]", "rotate-[0.2deg]", "rotate-[-0.2deg]"];
            const subtleTranslations = ["md:translate-y-1", "md:-translate-y-0.5", "md:translate-y-1.5"];
            const cardBorders = ["rounded-3xl", "rounded-[24px]", "rounded-[28px]"];
            
            // Understated, believable wait time helper
            let customizedEta = shop.eta;
            let shopFootnote = "";
            
            if (shop.id === 'shop_smooz') {
              customizedEta = "10 mins wait (usually takes 15 mins during busy hours)";
              shopFootnote = "*their cold coffee is a lifesaver during exams* 🥤";
            } else if (shop.id === 'shop_yogi99') {
              customizedEta = "12 mins wait (prepared fresh on the grill)";
              shopFootnote = "*schezwan noodles are prepared fresh to order* 🍜";
            } else if (shop.id === 'shop_teapost') {
              customizedEta = "8 mins wait (brews in small fresh batches)";
              shopFootnote = "*bun maska is best paired with hot ginger tea* 🍞";
            }

            return (
              <motion.div
                key={shop.id}
                variants={cardVariants}
                className={`group bg-white border border-secondary overflow-hidden shadow-warm-sm hover:shadow-warm-lg transition-bounce flex flex-col h-full relative
                  ${subtleRotations[idx % 3]} ${subtleTranslations[idx % 3]} ${cardBorders[idx % 3]}
                  ${!shop.is_open ? 'opacity-85' : ''}`}
              >
                {/* Image banner */}
                <div className="h-56 relative overflow-hidden bg-secondary">
                  <img 
                    src={shop.image_url} 
                    alt={shop.name} 
                    className="w-full h-full object-cover filter saturate-[0.8] contrast-[0.95]"
                  />
                  
                  {/* Float ETA bubble */}
                  {shop.is_open && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full text-[10px] font-bold text-textDark shadow-sm rotate-[-0.5deg]">
                      <Clock className="w-3.5 h-3.5 text-primary-hover" />
                      <span>{shop.eta} wait</span>
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-extrabold text-xl text-textDark font-poppins group-hover:text-primary-hover transition-colors leading-tight">
                        {shop.name}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold shadow-sm uppercase tracking-wide
                        ${shop.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {shop.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-mutedGrey font-bold uppercase tracking-wider">
                      <Store className="w-3.5 h-3.5" />
                      <span>{shop.category}</span>
                    </div>

                    {shop.is_open && (
                      <p className="text-[11px] text-marigold-saffron font-bold bg-[#FAF9F6] border border-secondary p-2.5 rounded-xl leading-relaxed">
                        🕒 {customizedEta}
                      </p>
                    )}

                    {shopFootnote && (
                      <p className="font-handwritten text-lg text-mutedGrey leading-none select-none pt-1">
                        {shopFootnote}
                      </p>
                    )}
                  </div>

                  {/* Bottom action button */}
                  <Link 
                    href={shop.is_open ? `/shops/${shop.id}` : '#'}
                    onClick={(e) => {
                      if (shop.is_open === false || shop.is_open === 'false') {
                        e.preventDefault();
                        alert("We're closed! Sorry for the inconvenience :)");
                      }
                    }}
                    className={`w-full py-3.5 px-4 mt-6 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm
                      ${shop.is_open 
                        ? 'bg-primary text-textDark hover:bg-primary-hover hover:shadow-warm-md hover:translate-y-[-1px]' 
                        : 'bg-secondary text-mutedGrey cursor-not-allowed'}`}
                  >
                    {shop.is_open ? (
                      <>
                        Browse Canteen Menu <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      "Closed for Now"
                    )}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* INFO FOOTER BANNER */}
      <div className="mt-16 bg-accent/30 rounded-[24px] p-6 border border-accent/25 flex flex-col sm:flex-row items-center gap-4 justify-between rotate-[-0.2deg]">
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-warm-sm rotate-[1deg]">
            <Zap className="w-5 h-5 text-textDark" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-textDark">UPI & Cash Payments Only</h4>
            <p className="text-xs text-mutedGrey font-semibold mt-0.5">Pay physically at the shop counter at pickup. Zero platform markup.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
