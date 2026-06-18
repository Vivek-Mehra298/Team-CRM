'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { apiFetch } from '../../../lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inviteToken = searchParams.get('inviteToken');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || (!inviteToken && !orgName)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/auth/signup', {
        method: 'POST',
        bodyData: {
          name,
          email,
          password,
          orgName: inviteToken ? undefined : orgName,
          inviteToken: inviteToken || undefined,
        },
      });

      login(response.token, response.user);
      
      if (inviteToken) {
        setSuccess('Signup successful! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setSuccess('Account created! Please check your terminal console logs for the mock verification link.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-foreground mb-6">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-black font-extrabold shadow-lg shadow-sky-500/10">
              T
            </div>
            Team<span className="text-sky-600">CRM</span>
          </Link>
          <h2 className="text-xl font-bold text-foreground">
            {inviteToken ? 'Join organization workspace' : 'Get started with TeamCRM'}
          </h2>
          <p className="text-muted text-sm mt-1">
            {inviteToken ? 'Sign up to accept your organization invitation' : 'Create a new CRM instance for your team'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            {!inviteToken && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Organization Name</label>
                <input
                  type="text"
                  placeholder="Acme Solutions Ltd"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-sky-600/10 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {success && !inviteToken && (
          <div className="mt-6 flex flex-col gap-3">
            <Link 
              href="/dashboard"
              className="w-full h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/10 cursor-pointer"
            >
              Go to Dashboard
            </Link>
            <p className="text-center text-[10px] text-muted">
              Note: Unverified accounts can browse the dashboard, but verification is recommended to lock role security.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-600 hover:text-sky-500 font-semibold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}

