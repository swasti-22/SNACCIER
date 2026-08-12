// app/login/page.js
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LogIn, UserPlus, RefreshCw, Key, Mail, User, ShieldAlert, ArrowLeft, Send, Check, ShieldCheck, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';
import { isCharusatEmail, CHARUSAT_EMAIL_ERROR } from '@/lib/validators';

function LoginContent() {
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { loginStudent, signupStudent, resetStudentPassword, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || 'dashboard';

  // Automatically redirect if already logged in
  useEffect(() => {
    if (user && user.type === 'student') {
      router.push(`/${redirect}`);
    }
  }, [user, redirect]);

  // Direct email sender handler for Firebase password reset
  const handleSendEmailLink = async () => {
    if (!email) {
      setError('Please provide your email address first.');
      return;
    }
    if (!isCharusatEmail(email)) {
      setError(CHARUSAT_EMAIL_ERROR);
      return;
    }
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      if (isFirebaseConfigured && auth) {
        const actionCodeSettings = {
          url: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login',
          handleCodeInApp: true
        };
        await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
        setEmailSent(true);
        setSuccessMessage(`Reset link has been dispatched to ${email}! Please check your Inbox and Spam folder. (Or set a new password below)`);
      } else {
        setEmailSent(true);
        setSuccessMessage(`Simulated mail sent to ${email}! You can also set a new password directly below.`);
      }
    } catch (fbErr) {
      console.warn("Firebase email error:", fbErr);
      if (fbErr.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (fbErr.code === 'auth/user-not-found') {
        // If not in Firebase yet, inform and offer instant direct reset
        setEmailSent(true);
        setSuccessMessage(`Notice: ${email} is registered locally on campus. You can set a new password directly below.`);
      } else {
        setEmailSent(true);
        setSuccessMessage(`Email request processed. If the email doesn't appear in your inbox, set your new password directly below.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);
    
    if (!isCharusatEmail(email)) {
      setError(CHARUSAT_EMAIL_ERROR);
      setSubmitting(false);
      return;
    }
    
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

        const passToSet = newPassword || password;
        if (!passToSet || passToSet.length < 4) {
          // If no new password typed, trigger email send
          await handleSendEmailLink();
          return;
        }

        // Direct instant password reset & login
        await resetStudentPassword(email, passToSet);
        setSuccessMessage('Password updated successfully! Logging you in...');
        setTimeout(() => {
          router.push(`/${redirect}`);
        }, 800);
      }
    } catch (err) {
      let msg = err.message || 'Verification error. Please try again.';
      if (err.code === 'auth/user-not-found' || msg.includes('user-not-found')) {
        msg = 'No account was found under this email address. Please sign up.';
      } else if (err.code === 'auth/wrong-password' || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Incorrect password. Please check your credentials or reset your password.';
      } else if (err.code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
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

      <div className="w-full max-w-md bg-[#FDFBF7] border-2 border-dashed border-textDark/20 p-8 rounded-3xl shadow-warm-lg space-y-6 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">

        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-textDark text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
            <GraduationCap className="w-3.5 h-3.5" /> CHARUSAT Campus Only
          </div>
          <h1 className="font-poppins text-3xl font-extrabold text-textDark tracking-tight lowercase">
            {viewMode === 'login' && 'welcome back'}
            {viewMode === 'signup' && 'join snaccier!'}
            {viewMode === 'forgot' && 'recover account'}
          </h1>
          <p className="text-xs text-mutedGrey font-bold leading-relaxed max-w-xs mx-auto">
            {viewMode === 'login' && 'Log in with your official university email.'}
            {viewMode === 'signup' && 'Sign up with your CHARUSAT university email ID.'}
            {viewMode === 'forgot' && 'Send a reset link to your CHARUSAT email.'}
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
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">CHARUSAT Email Address</label>
              <span className="text-[9px] font-semibold text-primary-hover">@charusat.edu.in</span>
            </div>
            <div className="relative">
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="22ce001@charusat.edu.in"
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
                      setEmailSent(false);
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

          {/* FORGOT PASSWORD SPECIFIC OPTIONS */}
          {viewMode === 'forgot' && (
            <div className="space-y-4 pt-2">
              {/* Option 1: Send Reset Link */}
              <button
                type="button"
                onClick={handleSendEmailLink}
                disabled={submitting || !email}
                className="w-full py-3 bg-white border-2 border-dashed border-primary text-textDark font-bold rounded-xl text-xs hover:bg-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-primary-hover" /> Send Reset Link to Email
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-secondary"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-mutedGrey uppercase tracking-widest">or set new password</span>
                <div className="flex-grow border-t border-secondary"></div>
              </div>

              {/* Option 2: Direct New Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-mutedGrey uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full border border-secondary rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary bg-background"
                  />
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-mutedGrey" />
                </div>
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
                Update Password & Log In <ShieldCheck className="w-4 h-4" />
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
              Remembered your password?{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader message="Loading SNACCIER..." />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
