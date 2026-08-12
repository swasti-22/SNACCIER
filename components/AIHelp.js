// components/AIHelp.js
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, ChevronRight, RefreshCw, Store } from 'lucide-react';
import { getShops } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';

export default function AIHelp() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! If you are looking for canteen recommendations or menu information, feel free to ask.",
      time: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const chatEndRef = useRef(null);

  // Load all menu items on mount
  useEffect(() => {
    if (!user || user.type !== 'student') return;
    
    const fetchMenu = async () => {
      try {
        const shops = await getShops();
        let allItems = [];
        shops.forEach(shop => {
          if (shop.menu) {
            allItems = [...allItems, ...shop.menu.map(item => ({ ...item, shopName: shop.name }))];
          }
        });
        setMenuItems(allItems);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMenu();
  }, [user]);

  useEffect(() => {
    if (!user || user.type !== 'student') return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, user]);

  if (!user || user.type !== 'student') return null;

  const getAssistantResponse = (query) => {
    const text = query.toLowerCase();
    
    if (text.includes('50') || text.includes('fifty') || text.includes('cheap') || text.includes('broke') || text.includes('paisa') || text.includes('budget')) {
      const cheapItems = menuItems.filter(item => item.price <= 50 && !item.sold_out);
      const itemsList = cheapItems.map(i => `• ${i.name} (₹${i.price}) at ${i.shopName}`).join('\n');
      return {
        text: `Here are the menu options under ₹50 available right now:\n\n${itemsList || "• Amul Kool Koko (₹30) at AMUL\n• Chocolate Cone Ice Cream (₹40) at AMUL"}\n\nAmul offers great pocket-friendly treats!`,
        items: cheapItems
      };
    }

    if (text.includes('health') || text.includes('diet') || text.includes('calories') || text.includes('gym') || text.includes('fit') || text.includes('protein')) {
      const healthyItems = menuItems.filter(item => (item.calories && item.calories < 250));
      const itemsList = healthyItems.map(i => `• ${i.name} (${i.calories} cal, ₹${i.price}) at ${i.shopName}`).join('\n');
      return {
        text: `Here are the lighter menu choices available on campus:\n\n${itemsList || "• Amul Kool Koko (150 cal) at AMUL"}\n\nCheck out AMUL and Yogi 99 for quick lighter bites.`,
        items: healthyItems
      };
    }

    if (text.includes('fast') || text.includes('quick') || text.includes('hurry') || text.includes('speed') || text.includes('lecture') || text.includes('class') || text.includes('late')) {
      const fastItems = menuItems.filter(item => (item.shopName.includes('AMUL') || item.shopName.includes('YOGI 99')) && !item.sold_out);
      const itemsList = fastItems.map(i => `• ${i.name} (₹${i.price}) from ${i.shopName}`).join('\n');
      return {
        text: `If you are in a hurry, packaged snacks and ready-to-serve items at AMUL and Yogi 99 are the fastest:\n\n${itemsList || "• Amul Kool Koko (₹30) from AMUL\n• Ice Cream Cone (₹40) from AMUL"}\n\nYou can order in advance and pick it up when you arrive.`,
        items: fastItems
      };
    }

    if (text.includes('fill') || text.includes('heavy') || text.includes('meal') || text.includes('lunch') || text.includes('dinner') || text.includes('hungry')) {
      const heavyItems = menuItems.filter(item => item.price >= 70 && !item.sold_out);
      const itemsList = heavyItems.map(i => `• ${i.name} (₹${i.price}) at ${i.shopName}`).join('\n');
      return {
        text: `For a more substantial meal, here are the main course options:\n\n${itemsList || "• Schezwan Noodles (₹85) at DANNY'S KITCHEN\n• Special Fried Rice (₹90) at DANNY'S KITCHEN"}\n\nThe noodles and fried rice at Danny's Kitchen are excellent options.`,
        items: heavyItems
      };
    }

    if (text.includes('drink') || text.includes('bev') || text.includes('chai') || text.includes('tea') || text.includes('coffee') || text.includes('smoothie') || text.includes('shake') || text.includes('koko')) {
      const drinks = menuItems.filter(item => (item.shopName.includes('AMUL') || item.name.toLowerCase().includes('drink') || item.name.toLowerCase().includes('koko')) && !item.sold_out);
      const itemsList = drinks.map(i => `• ${i.name} (₹${i.price}) at ${i.shopName}`).join('\n');
      return {
        text: `Here are the available beverages on campus:\n\n${itemsList || "• Amul Kool Koko (₹30) at AMUL"}\n\nAmul Kool Koko is always a classic favorite!`,
        items: drinks
      };
    }

    const matched = menuItems.filter(item => 
      item.name.toLowerCase().includes(text) || 
      (item.description && item.description.toLowerCase().includes(text))
    );

    if (matched.length > 0) {
      const list = matched.map(i => `• ${i.name} (₹${i.price}) at ${i.shopName}`).join('\n');
      return {
        text: `I found the following matches on the campus menu:\n\n${list}\n\nYou can navigate to the respective canteen to order.`,
        items: matched
      };
    }

    return {
      text: "I couldn't find any direct matches. Please ask for options under ₹50, healthy selections, fast preparation, or filling meals.",
      items: []
    };
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const reply = getAssistantResponse(textToSend);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: reply.text,
        time: new Date(),
        items: reply.items
      }]);
    }, 600);
  };

  const quickChips = [
    { label: "Under ₹50", query: "what can I get under 50 rupees?" },
    { label: "Healthy Options", query: "what is the healthiest option?" },
    { label: "Fast Preparation", query: "late for class, what is fastest?" },
    { label: "Filling Meals", query: "suggest a filling lunch meal" },
    { label: "Beverages", query: "what is the best drink?" }
  ];

  return (
    <>
      {/* FLOATING ACTION CHAT TRIGGER */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center bg-primary hover:bg-primary-hover text-textDark h-16 w-16 rounded-full shadow-warm-lg border-2 border-accent transition-bounce active-pulse animate-float cursor-pointer"
        >
          <Sparkles className="w-6 h-6 text-textDark" />
        </motion.button>
      </div>

      {/* CHAT INTERFACE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] rounded-2xl glass shadow-warm-lg border border-secondary flex flex-col overflow-hidden"
          >
            {/* CHAT HEADER */}
            <div className="bg-accent/80 p-4 border-b border-secondary flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/90 p-2.5 rounded-full text-textDark shadow-inner border border-accent">
                  <Sparkles className="w-5 h-5 text-textDark" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-textDark uppercase tracking-wider">Campus Assistant</span>
                  </div>
                  <p className="text-[9px] text-mutedGrey font-semibold">Canteen food guide</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-textDark/60 hover:text-textDark transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CHAT MESSAGES PANEL */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%] space-y-2">
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm border
                        ${msg.sender === 'user' 
                          ? 'bg-primary border-primary/20 text-textDark rounded-tr-none' 
                          : 'bg-white border-secondary text-textDark rounded-tl-none'}`}
                    >
                      {msg.text}
                    </div>
                    
                    {/* Inline product recommendations */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {msg.items.slice(0, 2).map((item, itemIdx) => (
                          <div 
                            key={itemIdx} 
                            className="bg-white border border-secondary/70 p-2.5 rounded-xl text-[10px] flex flex-col justify-between shadow-sm"
                          >
                            <div>
                              <span className="font-semibold text-textDark truncate block">{item.name}</span>
                              <span className="text-mutedGrey text-[9px] truncate block">{item.shopName}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-1 border-t border-secondary/40">
                              <span className="font-bold text-textDark">₹{item.price}</span>
                              <span className="bg-primary/20 text-textDark px-1.5 py-0.5 rounded text-[8px] font-medium">Order</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="px-4 py-2 border-t border-secondary/40 overflow-x-auto flex gap-1.5 bg-secondary/20 no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="whitespace-nowrap bg-white border border-secondary hover:border-primary px-3 py-1 rounded-full text-[10px] text-textDark hover:bg-primary/10 transition-all shadow-sm flex items-center gap-1"
                >
                  {chip.label} <ChevronRight className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>

            {/* CHAT INPUT AREA */}
            <div className="p-3 bg-white border-t border-secondary/70 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me: 'Maggi under 50 rupees'..."
                className="flex-1 border border-secondary/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-background"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="bg-primary hover:bg-primary-hover disabled:bg-secondary text-textDark p-2 rounded-xl transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
