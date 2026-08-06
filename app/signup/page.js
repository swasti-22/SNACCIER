// app/signup/page.js
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LogIn, UserPlus, RefreshCw, Key, Mail, User, ShieldAlert, ArrowLeft, Send, Check } from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';

function SignupContent() {
  const [viewMode, setViewMode] = useState('signup'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { loginStudent, signupStudent, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || 'dashboard';

  // Automatically redirect if already logged in
  useEffect(() => {
    if (user && user.type === 'student') {
      router.push(`/${redirect}`);
    }
  }, [user, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);
    
    try {
      if (viewMode === 'login') {
        const success = await loginStudent(email, password);
        if (success) {
          router.push(`/${redirect}`);
        }
      } else if (viewMode === 'signup') {
        if (!name || !email || !password) {
          setError('All inputs must be completed.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Passwords must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        const success = await signupStudent(name, email, password);
        if (success) {
          router.push(`/${redirect}`);
        }
      } else if (viewMode === 'forgot') {
        if (!email) {
          setError('Please provide your email address.');
          setSubmitting(false);
          return;
        }

        if (isFirebaseConfigured && auth) {
          await sendPasswordResetEmail(auth, email);
          setSuccessMessage('Recovery link has been sent! Please check your inbox and spam, just in case.');
        } else {
          const users = JSON.parse(localStorage.getItem("snaccier_users") || "[]");
          const found = users.find(u => u.email === email);
          if (found) {
            setSuccessMessage(`Recovery link sent! (Local Simulation: Your current password is: "${found.password}")`);
          } else {
            setError('No registered campus account was found under this email.');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Verification error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="w-full max-w-md bg-[#FDFBF7] border-2 border-dashed border-textDark/25 p-8 rounded-3xl shadow-warm-lg space-y-6 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">

        <div className="text-center space-y-2 pt-2">
          <h1 className="font-poppins text-3xl font-extrabold text-textDark tracking-tight lowercase">
            {viewMode === 'login' && 'welcome back'}
            {viewMode === 'signup' && 'join snaccier!'}
            {viewMode === 'forgot' && 'recover account'}
          </h1>
          <p className="text-xs text-mutedGrey font-bold leading-relaxed max-w-xs mx-auto">
            {viewMode === 'login' && 'Order food from your favorite campus canteens.'}
            {viewMode === 'signup' && 'Join the campus pre-ordering system.'}
            {viewMode === 'forgot' && 'Enter your email to reset your account password.'}
          </p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-700 text-xs font-semibold flex items-start gap-2 leading-relaxed">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 stroke-[3]" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FULL NAME */}
          {viewMode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Swasti Vaishnav"
                  className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary bg-background"
                  required={viewMode === 'signup'}
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-mutedGrey" />
              </div>
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name123@gmail.com"
                className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary bg-background"
                required
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-mutedGrey" />
            </div>
          </div>

          {/* PASSWORD */}
          {viewMode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">Password</label>
                {viewMode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMessage('');
                      setViewMode('forgot');
                    }}
                    className="text-[10px] font-bold text-primary-hover hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary bg-background"
                  required={viewMode !== 'forgot'}
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-mutedGrey" />
              </div>
            </div>
          )}

          {/* Action button triggers */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-textDark font-extrabold rounded-xl text-xs shadow-sm hover:shadow-warm-md transition-bounce flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : viewMode === 'login' ? (
              <>
                Login <LogIn className="w-4 h-4" />
              </>
            ) : viewMode === 'signup' ? (
              <>
                Create Account <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                Send Recovery Link <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* BOTTOM LINKS TAB SWITCHER */}
        <div className="text-center text-xs font-semibold text-mutedGrey pt-2 border-t border-secondary/40 space-y-1">
          {viewMode === 'login' && (
            <div>
              Don&apos;t have a SNACCIER account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setViewMode('signup');
                }} 
                className="text-primary-hover hover:underline font-bold cursor-pointer"
              >
                Sign up
              </button>
            </div>
          )}

          {viewMode === 'signup' && (
            <div>
              Already have a registered account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setViewMode('login');
                }} 
                className="text-primary-hover hover:underline font-bold cursor-pointer"
              >
                Login
              </button>
            </div>
          )}

          {viewMode === 'forgot' && (
            <div>
              Remembered your credentials?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setViewMode('login');
                }} 
                className="text-primary-hover hover:underline font-bold cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading portal secure gate..." />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
