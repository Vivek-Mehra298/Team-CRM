'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setVerified } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setError('No verification token provided in the URL.');
        setLoading(false);
        return;
      }

      try {
        await apiFetch('/auth/verify-email', {
          method: 'POST',
          bodyData: { token },
        });

        setVerified();
        setSuccess('Email verified successfully! Your account is now fully active.');
      } catch (err: any) {
        setError(err.message || 'Verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token, setVerified]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl relative z-10 text-center"
      >
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-foreground mb-8">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-black font-extrabold shadow-lg shadow-sky-500/10">
            T
          </div>
          Team<span className="text-sky-600">CRM</span>
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <h2 className="text-lg font-semibold text-foreground">Verifying email address...</h2>
            <p className="text-xs text-muted">Checking tokens against authentication registry</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Verification Failed</h2>
              <p className="text-sm text-muted mt-2">{error}</p>
            </div>
            <Link 
              href="/login"
              className="mt-4 w-full h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center justify-center shadow-md shadow-sky-600/10"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Email Verified!</h2>
              <p className="text-sm text-muted mt-2">{success}</p>
            </div>
            <Link 
              href="/dashboard"
              className="mt-4 w-full h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center justify-center shadow-md shadow-sky-600/10"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

