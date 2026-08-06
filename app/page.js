// app/page.js
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Coffee, ArrowRight, Store, Clock, Mail, 
  Gift, Award, Sparkles, Navigation, Wallet,
  Flame, Heart, Smile, Smartphone, ChefHat, Check, Zap, CreditCard
} from 'lucide-react';
import { getShops, subscribeToOpinions, submitOpinion, reactToOpinion, deleteOpinion, editOpinion } from '@/lib/db';

export default function Home() {
  const [popularShops, setPopularShops] = useState([]);
  const [opinions, setOpinions] = useState([]);
  const [newOpinion, setNewOpinion] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTag, setSelectedTag] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userReactions, setUserReactions] = useState({});
  const [myOpinions, setMyOpinions] = useState([]);
  const [editingOpinionId, setEditingOpinionId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("snaccier_user_reactions");
        if (stored) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUserReactions(JSON.parse(stored));
        }
        const storedOpinions = localStorage.getItem("snaccier_opinions");
        if (storedOpinions) {
          if (storedOpinions.includes("samosa too spicy") || storedOpinions.includes("cold coffee lowkey") || storedOpinions.includes("fries were criminally")) {
            localStorage.setItem("snaccier_opinions", "[]");
            window.dispatchEvent(new Event("snaccier_opinions"));
          }
        }
        const myOps = localStorage.getItem("snaccier_my_opinions");
        if (myOps) {
          setMyOpinions(JSON.parse(myOps));
        }
      } catch (e) {}
    }
  }, []);

  const handleReact = async (opinionId, reactionType) => {
    if (userReactions[opinionId]) return;
    const updated = { ...userReactions, [opinionId]: reactionType };
    setUserReactions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("snaccier_user_reactions", JSON.stringify(updated));
      } catch (e) {}
    }
    await reactToOpinion(opinionId, reactionType);
  };

  const handleDeleteOpinion = async (opinionId) => {
    if (confirm("Are you sure you want to delete this opinion?")) {
      const success = await deleteOpinion(opinionId);
      if (success) {
        const updated = myOpinions.filter(id => id !== opinionId);
        setMyOpinions(updated);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("snaccier_my_opinions", JSON.stringify(updated));
          } catch (e) {}
        }
      }
    }
  };

  const handleSaveEdit = async (opinionId) => {
    if (!editText.trim()) return;
    try {
      const success = await editOpinion(opinionId, editText);
      if (success) {
        setEditingOpinionId(null);
        setEditText('');
      }
    } catch (err) {
      alert(err.message || "Failed to edit opinion.");
    }
  };

  useEffect(() => {
    const fetchShops = async () => {
      const shops = await getShops();
      setPopularShops(shops.slice(0, 3));
    };
    fetchShops();

    const unsubscribeOpinions = subscribeToOpinions((loadedOpinions) => {
      const withReactionCounts = loadedOpinions.map(op => {
        const total = (op.reactions?.fire || 0) + (op.reactions?.hearts || 0) + (op.reactions?.laugh || 0);
        return { ...op, totalReactions: total };
      });
      
      const topFive = [...withReactionCounts]
        .sort((a, b) => b.totalReactions - a.totalReactions)
        .slice(0, 5);
        
      const ascendingSorted = [...topFive]
        .sort((a, b) => a.totalReactions - b.totalReactions);
        
      setOpinions(ascendingSorted);
    });

    return () => {
      if (unsubscribeOpinions) unsubscribeOpinions();
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-background text-textDark">
      
      {/* HERO SECTION */}
      <section className="relative px-6 py-12 md:py-24 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Soft, warm ambient light blobs */}
        <div className="absolute top-12 left-1/3 w-72 h-72 bg-marigold/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-6 right-12 w-52 h-52 bg-primary/10 rounded-full blur-3xl -z-10" />

        {/* Quietly Staggered Left Column */}
        <div className="flex-1 text-left relative">
          <motion.h1 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-poppins text-4xl md:text-6xl font-extrabold tracking-tight text-black leading-[1.05] mb-6"
          >
            Canteen food,<br />
            <span className="relative inline-block text-black">
              without the wait.
              <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary-pink/70" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,7 C30,2 70,2 100,7" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base md:text-lg text-mutedGrey font-medium max-w-lg mb-8 leading-relaxed"
          >
            Check menu availability, order from your lecture bench, and pick up when it's hot. No crowded queues or wasted trips.
          </motion.p>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <Link 
              href="/shops" 
              className="px-8 py-4 bg-marigold hover:bg-marigold/90 text-textDark font-black rounded-2xl shadow-marigold hover:shadow-warm-lg flex items-center gap-2 transition-all duration-300 scale-100 hover:scale-[1.02] cursor-pointer"
            >
              Browse Canteens <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-4 bg-white hover:bg-secondary/40 border border-secondary text-textDark font-semibold rounded-2xl shadow-warm-sm flex items-center gap-2 transition-all"
            >
              Student Portal
            </Link>
            <Link 
              href="/shop-access" 
              className="px-6 py-4 bg-accent/80 hover:bg-accent text-textDark font-semibold rounded-2xl shadow-warm-sm flex items-center gap-2 transition-all"
            >
              Operator Access
            </Link>
          </motion.div>
        </div>

        {/* Real-time Campus Opinions Feed Column */}
        <div className="flex-1 w-full flex flex-col items-center md:items-end">
          <div className="w-full max-w-md bg-[#FDFBF7] border-2 border-dashed border-textDark/25 p-6 rounded-3xl shadow-warm-md space-y-6 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            
            {/* Header info */}
            <div className="flex justify-between items-center pb-3 border-b border-textDark/15">
              <div>
                <h3 className="font-poppins font-black text-sm text-textDark uppercase tracking-wider flex items-center gap-1.5">
                  <span>Campus Opinions</span>
                </h3>
                <p className="text-[10px] text-mutedGrey font-medium mt-0.5">Top student comments from around the campus canteens.</p>
              </div>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="px-2.5 py-1.5 bg-primary text-textDark font-black text-[9px] uppercase rounded-xl transition-all shadow-sm hover:bg-primary-hover flex items-center gap-1 cursor-pointer"
              >
                {showForm ? "View Takes" : "Share a Take"}
              </button>
            </div>

            {!showForm ? (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {opinions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-mutedGrey font-semibold italic">
                    no opinions pinned yet. Be the first one to share your thoughts!
                  </div>
                ) : (
                  opinions.map((op, opIdx) => {
                    const cardTilts = ["rotate-[-0.3deg]", "rotate-[0.2deg]", "rotate-[-0.1deg]", "rotate-[0.3deg]", "rotate-[-0.2deg]"];
                    const tilt = cardTilts[opIdx % cardTilts.length];
                    return (
                      <div 
                        key={op.id || opIdx} 
                        className={`bg-white p-3.5 rounded-2xl border border-secondary/60 shadow-warm-sm space-y-2 relative transition-all duration-300 hover:shadow-warm-md hover:scale-[1.01] ${tilt}`}
                      >
                        {/* Quote Text */}
                        {editingOpinionId === op.id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              className="w-full border border-secondary rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary bg-white min-h-[50px] font-medium"
                              maxLength={140}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingOpinionId(null)}
                                className="px-2 py-1 text-[10px] bg-secondary hover:bg-secondary/80 text-textDark font-bold rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(op.id)}
                                className="px-2.5 py-1 text-[10px] bg-primary hover:bg-primary-hover text-textDark font-black rounded-lg cursor-pointer shadow-sm"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-textDark font-medium leading-relaxed italic">
                            &quot;{op.text}&quot;
                          </p>
                        )}

                        {/* Author info & Tag */}
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-mutedGrey font-bold">
                            — {op.author} {op.location && `, ${op.location}`}
                            {op.edit_count > 0 && <span className="text-[8px] text-mutedGrey/80 italic ml-1">(edited)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            {!editingOpinionId && (
                              <div className="flex items-center gap-1.5 mr-2">
                                  {(!op.edit_count || op.edit_count === 0) && (
                                    <button
                                      onClick={() => {
                                        setEditingOpinionId(op.id);
                                        setEditText(op.text);
                                      }}
                                      className="text-mutedGrey hover:text-textDark font-black transition-all cursor-pointer bg-transparent border-0 p-0 text-[9px]"
                                      title="Edit once"
                                    >
                                      edit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteOpinion(op.id)}
                                    className="text-mutedGrey hover:text-red-600 font-black transition-all cursor-pointer bg-transparent border-0 p-0 text-[9px]"
                                    title="Delete"
                                  >
                                    delete
                                  </button>
                                </div>
                              )}
                              <span className="bg-secondary/40 text-textDark px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[8px]">
                                {op.tag}
                              </span>
                            </div>
                          </div>

                          {/* Reactions row */}
                          <div className="flex items-center gap-3 pt-2 border-t border-textDark/5 mt-1 text-[9px] font-bold text-mutedGrey">
                            <button 
                              onClick={() => handleReact(op.id, 'fire')}
                              disabled={!!userReactions[op.id]}
                              className={`flex items-center gap-1 transition-all rounded-lg px-2 py-1
                                ${userReactions[op.id] === 'fire' ? 'bg-[#FFF3E0] text-[#E65100]' : 'hover:text-textDark'}
                                ${userReactions[op.id] ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                            >
                              <Flame className="w-3.5 h-3.5" /> <span>{op.reactions?.fire || 0}</span>
                            </button>
                            <button 
                              onClick={() => handleReact(op.id, 'hearts')}
                              disabled={!!userReactions[op.id]}
                              className={`flex items-center gap-1 transition-all rounded-lg px-2 py-1
                                ${userReactions[op.id] === 'hearts' ? 'bg-[#FCE4EC] text-[#C2185B]' : 'hover:text-textDark'}
                                ${userReactions[op.id] ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                            >
                              <Heart className="w-3.5 h-3.5" /> <span>{op.reactions?.hearts || 0}</span>
                            </button>
                            <button 
                              onClick={() => handleReact(op.id, 'laugh')}
                              disabled={!!userReactions[op.id]}
                              className={`flex items-center gap-1 transition-all rounded-lg px-2 py-1
                                ${userReactions[op.id] === 'laugh' ? 'bg-[#FFFDE7] text-[#F57F17]' : 'hover:text-textDark'}
                                ${userReactions[op.id] ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                            >
                              <Smile className="w-3.5 h-3.5" /> <span>{op.reactions?.laugh || 0}</span>
                            </button>
                          </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newOpinion.trim()) return;
                setIsSubmitting(true);
                try {
                  const successId = await submitOpinion(newOpinion, author, location, selectedTag);
                  if (successId) {
                    setNewOpinion('');
                    setAuthor('');
                    setLocation('');
                    setShowForm(false);
                    
                    const updatedMyOps = [...myOpinions, successId];
                    setMyOpinions(updatedMyOps);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("snaccier_my_opinions", JSON.stringify(updatedMyOps));
                      } catch (err) {}
                    }
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-3 font-semibold text-textDark">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-mutedGrey block">Your Opinion</label>
                  <textarea
                    value={newOpinion}
                    onChange={e => setNewOpinion(e.target.value)}
                    placeholder="e.g. The cold coffee at SMOOZ is excellent."
                    className="w-full border border-secondary rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white min-h-[60px]"
                    required
                    maxLength={140}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-mutedGrey block">Name</label>
                    <input
                      type="text"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      placeholder="e.g. Swasti"
                      className="w-full border border-secondary rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-mutedGrey block">Department</label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Electronics & Communication"
                      className="w-full border border-secondary rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-mutedGrey block">Category Tag</label>
                  <select
                    value={selectedTag}
                    onChange={e => setSelectedTag(e.target.value)}
                    className="w-full border border-secondary rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-white cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Food Quality">Food Quality</option>
                    <option value="Service Speed">Service Speed</option>
                    <option value="Recommendations">Recommendations</option>
                    <option value="Canteen Feedback">Canteen Feedback</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-textDark font-black rounded-xl text-xs shadow-sm transition-bounce flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? "Posting take..." : "Pin Take to Wall"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/15 border-y border-secondary/40 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-left max-w-xl md:ml-4">
            <h2 className="text-3xl font-extrabold text-textDark mb-3 flex items-center gap-2">
              How it works
            </h2>
            <p className="text-xs md:text-sm text-mutedGrey font-semibold leading-relaxed">
              We connected canteen screens to a simple pre-order page so you can skip the long queues.
            </p>
          </div>

          {/* Calmer Card rhythm Grid (very subtle card rotation, less chaotic offset) */}
          <div className="flex flex-col md:flex-row gap-8 items-stretch justify-between">
            
            {/* CARD 1 */}
            <div className="flex-1 bg-white p-7 rounded-3xl shadow-warm-sm border border-secondary/60 transition-bounce hover:shadow-warm-lg rotate-[-0.2deg] flex flex-col justify-between">
              <div>
                <div className="bg-primary/20 w-11 h-11 rounded-xl text-textDark mb-5 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-textDark mb-2 leading-tight">1. Order from Bench</h3>
                <p className="text-[11px] text-mutedGrey leading-relaxed font-semibold">
                  Browse menus from your lecture hall. Add custom instructions like <span className="text-textDark font-bold italic">“ginger tea with half sugar”</span> or <span className="text-textDark font-bold italic">“make it extra spicy”</span> so it is made just how you like it.
                </p>
              </div>
            </div>
 
            {/* CARD 2 */}
            <div className="flex-1 bg-white p-7 rounded-3xl shadow-warm-sm border border-secondary/60 transition-bounce hover:shadow-warm-lg rotate-[0.3deg] flex flex-col justify-between">
              <div>
                <div className="bg-accent/30 w-11 h-11 rounded-xl text-textDark mb-5 flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-textDark mb-2 leading-tight">2. Chef Starts Cooking</h3>
                <p className="text-[11px] text-mutedGrey leading-relaxed font-semibold">
                  The canteen operator receives your ticket instantly on their kitchen terminal. They prepare your snacks fresh while you pack up and finish the lab.
                </p>
              </div>
            </div>
 
            {/* CARD 3 */}
            <div className="flex-1 bg-white p-7 rounded-3xl shadow-warm-sm border border-secondary/60 transition-bounce hover:shadow-warm-lg rotate-[-0.1deg] flex flex-col justify-between">
              <div>
                <div className="bg-green-50 w-11 h-11 rounded-xl text-green-700 mb-5 flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-textDark mb-2 leading-tight">3. Grab and Go</h3>
                <p className="text-[11px] text-mutedGrey leading-relaxed font-semibold">
                  Get a notification on your phone when food is ready. Walk down once to pickup, show your ticket ID, and scan the counter QR code to pay.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* POPULAR CANTEENS PREVIEW */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        {/* Understated Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-textDark mb-2 flex items-center gap-2">
              Popular Canteens 
            </h2>
            <p className="text-xs md:text-sm text-mutedGrey font-semibold">
              Preloaded approved campus kitchens serving hot meals right now.
            </p>
          </div>
          <Link href="/shops" className="flex items-center gap-1.5 font-bold text-xs text-textDark hover:text-primary-hover group transition-all">
            See All Shops <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Quietly paced layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularShops.map((shop, idx) => {
            const cardBorders = ["rounded-3xl", "rounded-2xl", "rounded-[28px]"];
            const subtleRotations = ["rotate-[-0.3deg]", "rotate-[0.2deg]", "rotate-[-0.2deg]"];
            
            return (
              <motion.div 
                key={shop.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`bg-white border border-secondary overflow-hidden shadow-warm-sm hover:shadow-warm-lg transition-bounce flex flex-col h-full
                  ${cardBorders[idx % 3]} ${subtleRotations[idx % 3]}`}
              >
                <div className="h-44 relative overflow-hidden bg-secondary">
                  <img 
                    src={shop.image_url} 
                    alt={shop.name} 
                    className="w-full h-full object-cover filter saturate-[0.8]"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-full text-[10px] font-bold text-textDark shadow-sm">
                    <Clock className="w-3 h-3 text-primary-hover" />
                    {shop.eta}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-base text-textDark font-poppins">{shop.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${shop.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {shop.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-[10px] text-mutedGrey font-bold uppercase tracking-wider mb-4">{shop.category}</p>
                  </div>
                  
                  <Link 
                    href={shop.is_open ? `/shops/${shop.id}` : '#'}
                    onClick={(e) => {
                      if (shop.is_open === false || shop.is_open === 'false') {
                        e.preventDefault();
                        alert("This canteen is currently closed. Please check back later.");
                      }
                    }}
                    className="w-full text-center py-2.5 bg-secondary hover:bg-primary text-textDark font-bold rounded-xl text-xs transition-all shadow-sm"
                  >
                    View Menu
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SNACCIER CLUB LOYALTY (Quiet index card layout) */}
      <section className="bg-white py-16 px-6 border-t border-secondary/50 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-pink/5 rounded-full blur-2xl -z-10" />

        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Subtle Header */}
          <div className="text-left max-w-xl md:ml-4 space-y-3">
            <div className="inline-flex bg-primary/20 text-textDark p-2.5 rounded-2xl shadow-sm rotate-[-1.5deg]">
              <Gift className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-extrabold text-textDark tracking-tight font-poppins flex items-center gap-2">
              Canteen Stamp Cards
            </h2>
            <p className="text-xs md:text-sm text-mutedGrey font-semibold leading-relaxed">
              Earn stamps automatically on your digital card every time you pick up orders. Reach milestone goals to unlock automatic check-out discounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* LOYALTY CARD DESIGN (Understated premium graph layout) */}
            <div className="bg-white rounded-3xl border border-secondary p-6 md:p-8 shadow-warm-sm flex flex-col justify-between space-y-6 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="space-y-4">
                <h3 className="font-poppins font-black text-lg text-textDark flex items-center gap-2">
                  How the Milestones Work
                </h3>
                <p className="text-xs text-mutedGrey leading-relaxed font-semibold">
                  Every order you pick up adds an automatic stamp to your account. No paper cards to lose.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex gap-3 items-start">
                    <span className="h-6 w-6 rounded-full bg-primary text-textDark font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-secondary">1</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-textDark">Milestone 1: 5 Orders (10% Off next order)</h4>
                      <p className="text-[10px] text-mutedGrey leading-relaxed mt-0.5">Collect 5 stamps from any canteen to unlock an automatic 10% discount for your next checkout.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="h-6 w-6 rounded-full bg-accent text-textDark font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-secondary">2</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-textDark">Milestone 2: 15 Orders (20% Off next 10)</h4>
                      <p className="text-[10px] text-mutedGrey leading-relaxed mt-0.5">Keep ordering to hit 15 stamps and unlock a massive 20% discount applicable on your next 10 canteen orders!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 border border-secondary p-3 rounded-2xl text-center text-[10px] text-mutedGrey font-bold uppercase tracking-wider">
                Stamps count adds up automatically in real-time as soon as the operator hands over your order.
              </div>
            </div>

            {/* DIRECT ADVANTAGES & CAMPUS PERKS (Varied card sizing & alignment) */}
            <div className="flex flex-col justify-between gap-6">

              <div className="bg-[#FFF8F3] border border-marigold/20 p-6 rounded-2xl space-y-1.5 relative overflow-hidden flex-1 flex flex-col justify-center shadow-warm-sm hover:shadow-warm-md transition-all duration-300">
                <div className="text-xl">
                  <Zap className="w-5.5 h-5.5 text-marigold" />
                </div>
                <h4 className="font-poppins font-black text-xs text-textDark tracking-wide uppercase">Order During Lectures, Pick Up on Break</h4>
                <p className="text-[10px] text-mutedGrey leading-relaxed font-semibold">
                  Avoid the mid-break rush by securing your hot coffee or snack beforehand. Pick it up directly when the bell rings.
                </p>
              </div>

              <div className="bg-secondary/35 border border-secondary p-6 rounded-[28px] space-y-1.5 relative overflow-hidden flex-1 flex flex-col justify-center shadow-warm-sm hover:shadow-warm-md transition-all duration-300">
                <div className="text-xl">
                  <CreditCard className="w-5.5 h-5.5 text-accent" />
                </div>
                <h4 className="font-poppins font-black text-xs text-textDark uppercase tracking-wide">Direct Counter UPI & Cash</h4>
                <p className="text-[10px] text-mutedGrey leading-relaxed font-semibold">
                  Pre-orders are secured completely free of charge. Scan the counter UPI QR code or pay in cash at pick-up. No failed prepaid transactions or stuck funds.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ROADMAP SECTION (Updates we're looking forward to) */}
      <section className="bg-secondary/10 py-16 px-6 border-t border-secondary/50 relative overflow-hidden">
        
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-left max-w-xl md:ml-4 space-y-2">
            <div className="inline-flex bg-[#FAF9F6] border border-secondary p-2.5 rounded-xl shadow-sm rotate-[1.5deg]">
              <Sparkles className="w-5 h-5 text-primary-hover animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold text-textDark tracking-tight font-poppins">
              Updates we&apos;re looking forward to
            </h2>
            <p className="text-xs md:text-sm text-mutedGrey font-semibold leading-relaxed">
              We are working together to design these friendly helper additions, hoping to make college runs a little smoother for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* FEATURE 1: HOSTEL DELIVERY SQUAD */}
            <div className="bg-white border border-secondary p-6 rounded-3xl shadow-warm-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center pb-2.5 border-b border-secondary/40">
                  <h3 className="font-poppins font-black text-sm text-textDark flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-marigold-saffron" /> Hostel Delivery Squad
                  </h3>
                </div>
                
                <p className="text-[11px] text-mutedGrey leading-relaxed font-semibold mt-3">
                  We are gathering a squad of student runners to deliver hot food or iced drinks directly to your hostel block gates when they walk back from classes.
                </p>
              </div>

              <div className="text-[9px] text-mutedGrey font-black uppercase tracking-wider select-none">
                Status: In Development
              </div>
            </div>

            {/* FEATURE 2: ONLINE PAYMENTS */}
            <div className="bg-white border border-secondary p-6 rounded-3xl shadow-warm-sm flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex justify-between items-center pb-2.5 border-b border-secondary/40">
                  <h3 className="font-poppins font-black text-sm text-textDark flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-accent" /> Direct Online Payments
                  </h3>
                  <span className="bg-accent text-textDark text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Designing</span>
                </div>
                
                <p className="text-[11px] text-mutedGrey leading-relaxed font-semibold mt-3">
                  Integrating direct online UPI checkout flows inside the website so you can secure payments in advance without opening your wallet at the counter.
                </p>
              </div>

              <div className="text-[9px] text-mutedGrey font-black uppercase tracking-wider select-none">
                Status: In Development
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FEEDBACK & GRIEVANCES SECTION */}
      <section className="bg-white py-16 px-6 border-t border-secondary/50 relative">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="bg-marigold/10 inline-flex p-3 rounded-full text-marigold shadow-sm border border-marigold/20 rotate-[6deg]">
            <Mail className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-textDark font-poppins flex items-center justify-center gap-2">
            Got Complaints or Ideas?
          </h2>
          <p className="text-xs md:text-sm text-mutedGrey font-semibold max-w-lg mx-auto leading-relaxed">
            Spicy samosas, warm drinks, or cool ideas? Send feedback straight to Swasti at **swastiivv.22@gmail.com**. We are always trying to make canteen runs a bit better.
          </p>
          <div className="pt-2">
            <a 
              href="mailto:swastiivv.22@gmail.com?subject=SNACCIER%20Feedback%20%26%20Grievances"
              className="inline-flex items-center gap-2 bg-marigold hover:bg-marigold/95 text-textDark font-black px-7 py-4 rounded-2xl shadow-warm-md hover:shadow-warm-lg text-xs tracking-wider transition-bounce scale-100 hover:scale-[1.02] cursor-pointer"
            >
              Send Feedback
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-transparent py-12 px-6 border-t border-secondary/55">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-poppins font-extrabold text-xl text-textDark">
            <span className="bg-primary/95 p-1.5 rounded-xl text-[#6F4E37] flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </span>
            SNACCIER
          </div>
          <p className="text-xs text-textDark/60 font-bold">
            for the students of CHARUSAT, by a student of CHARUSAT
          </p>
          <div className="flex gap-5 text-xs font-black text-textDark">
            <Link href="/shops" className="hover:text-marigold transition-all">Canteens</Link>
            <Link href="/login" className="hover:text-marigold transition-all">Student Portal</Link>
            <Link href="/shop-access" className="hover:text-marigold transition-all">Operator Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
