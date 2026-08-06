// app/shop-access/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getShops } from '@/lib/db';
import { ShieldCheck, RefreshCw, Key, Store, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';

export default function ShopAccess() {
  const [shopId, setShopId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const { loginShop } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const loadedShops = await getShops();
        const verifiedShops = Array.isArray(loadedShops) ? loadedShops : [];
        setShops(verifiedShops);
        if (verifiedShops.length > 0) {
          setShopId(verifiedShops[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    // Simulate lightweight artificial delay for security feeling
    setTimeout(async () => {
      try {
        const success = await loginShop(shopId, pin);
        if (success) {
          router.push('/dashboard');
        } else {
          setError('Error. Please try again.');
        }
      } catch (err) {
        setError('Error. Please try again.');
      } finally {
        setVerifying(false);
      }
    }, 650);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Syncing secure shops index..." />
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-6 py-12 bg-background relative">
      <div className="absolute top-10 left-10 hidden sm:block">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs font-bold text-mutedGrey hover:text-textDark transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-secondary p-8 rounded-2xl shadow-warm-lg space-y-6 relative overflow-hidden">

        {/* Top security tag banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent" />

        <div className="text-center space-y-2">
          <h1 className="font-poppins text-3xl font-extrabold text-textDark tracking-tight flex items-center justify-center gap-2">
            Operator Portal <ShieldCheck className="w-6 h-6 text-accent-hover fill-accent/20" />
          </h1>
          <p className="text-xs text-mutedGrey font-medium leading-relaxed max-w-xs mx-auto">
            Authorized pre-approved canteen access terminal. No email signup required.
          </p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-xs font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* CANTEEN DROPDOWN */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Select Your Store</label>
            <div className="relative">
              <select
                value={shopId}
                onChange={e => setShopId(e.target.value)}
                className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:border-accent bg-background font-bold text-textDark cursor-pointer appearance-none"
                required
              >
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
              <Store className="absolute left-3.5 top-[15px] w-4 h-4 text-mutedGrey pointer-events-none" />
            </div>
          </div>

          {/* SECURE operator PIN */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Secure Operator PIN</label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:border-accent bg-background tracking-widest font-black"
                required
                maxLength={8}
              />
              <Key className="absolute left-3.5 top-[15px] w-4 h-4 text-mutedGrey" />
            </div>

          </div>

          {/* Action validation button */}
          <button
            type="submit"
            disabled={verifying}
            className="w-full py-4 bg-accent hover:bg-accent-hover text-textDark font-extrabold rounded-xl text-xs shadow-sm hover:shadow-warm-md transition-bounce flex items-center justify-center gap-1.5"
          >
            {verifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Verify PIN & Open Terminal
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
