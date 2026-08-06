// components/Navbar.js
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ShoppingBag, Store, Clock, Gift, User, LogOut, Menu, X, Coffee } from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Sync cart item counts from localStorage in real time
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("snaccier_cart") || "[]");
        const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCartCount();

    // Custom window event triggers update
    window.addEventListener("snaccier_cart", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("snaccier_cart", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => pathname === path;

  const linkClass = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
    ${isActive(path) 
      ? 'bg-primary text-textDark shadow-warm-sm font-semibold scale-[1.02]' 
      : 'text-mutedGrey hover:bg-secondary hover:text-textDark'}
  `;

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 glass shadow-warm-sm border-b border-secondary px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-poppins font-bold text-2xl tracking-tight text-textDark">
            <span className="h-5 w-5 border-2 border-textDark border-t-transparent rounded-full animate-spin" />
            SNACCIER
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass shadow-warm-sm border-b border-secondary/55 px-6 py-3 transition-all duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-poppins font-extrabold text-2xl tracking-tight text-textDark group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="bg-primary/95 p-1.5 rounded-xl text-[#6F4E37] shadow-warm-sm">
            <Coffee className="w-5 h-5" />
          </span>
          <span className="text-black transition-all">
            SNACCIER
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-2">
          {user?.type === 'student' && (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')}>
                <User className="w-4 h-4" /> Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {user?.type === 'shop' && (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')}>
                <ShoppingBag className="w-4 h-4" /> Orders Board
              </Link>
              <Link href="/controls" className={linkClass('/controls')}>
                <Store className="w-4 h-4" /> Store Settings
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link href="/login" className={linkClass('/login')}>
                <User className="w-4 h-4" /> Student Login
              </Link>
              <Link 
                href="/shop-access" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent/80 text-textDark hover:bg-accent hover:shadow-warm-sm transition-all duration-300"
              >
                <Store className="w-4 h-4" /> Shop Access
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          className="md:hidden p-2 rounded-xl hover:bg-secondary transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-textDark" /> : <Menu className="w-6 h-6 text-textDark" />}
        </button>
      </div>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-secondary mt-3 flex flex-col gap-2 animate-fade-in">
          {user?.type === 'student' && (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                <User className="w-4 h-4" /> Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left transition-all duration-300 w-full"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {user?.type === 'shop' && (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                <ShoppingBag className="w-4 h-4" /> Orders Board
              </Link>
              <Link href="/controls" className={linkClass('/controls')} onClick={() => setMobileMenuOpen(false)}>
                <Store className="w-4 h-4" /> Store Settings
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left transition-all duration-300 w-full"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link href="/login" className={linkClass('/login')} onClick={() => setMobileMenuOpen(false)}>
                <User className="w-4 h-4" /> Student Login
              </Link>
              <Link 
                href="/shop-access" 
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-accent/80 text-textDark hover:bg-accent text-left transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="w-4 h-4" /> Shop Access
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
