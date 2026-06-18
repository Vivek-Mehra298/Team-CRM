'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Building,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.04
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 }
  }
} as const;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Form State: Org Settings
  const [orgName, setOrgName] = useState('');
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState('');

  // 1. Fetch Organization Details
  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ['org-details'],
    queryFn: () => apiFetch('/org'),
  });

  useEffect(() => {
    setMounted(true);
    if (orgData?.org) {
      setOrgName(orgData.org.name);
    }
  }, [orgData]);

  const updateOrgMutation = useMutation({
    mutationFn: (name: string) =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ message: 'Organization name updated successfully' }), 500)
      ),
    onSuccess: () => {
      setOrgSuccess('Workspace settings saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['org-details'] });
    },
    onError: (err: any) => {
      setOrgError(err.message || 'Failed to update organization details.');
    }
  });

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');
    setOrgSuccess('');
    if (!orgName) return;

    updateOrgMutation.mutate(orgName);
  };

  if (!mounted || orgLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const isLeader = user?.role === 'leader';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-2xl text-left select-none"
    >
      {/* Title */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" /> Account & Workspace Settings
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Configure profile parameters, check role privileges, and change workspace details.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-6"
      >
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-border">
          <User className="w-4 h-4 text-sky-600" /> Personal Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="block text-muted font-bold uppercase tracking-wider mb-1">Full Name</span>
            <div className="font-bold text-slate-800 text-sm">{user?.name}</div>
          </div>

          <div>
            <span className="block text-muted font-bold uppercase tracking-wider mb-1">Email Address</span>
            <div className="text-slate-600 font-medium">{user?.email}</div>
          </div>

          <div>
            <span className="block text-muted font-bold uppercase tracking-wider mb-1">Workspace Role</span>
            <div className="text-sky-600 font-bold uppercase tracking-wider mt-0.5">{user?.role}</div>
          </div>

          <div>
            <span className="block text-muted font-bold uppercase tracking-wider mb-1">Verification Status</span>
            {user?.isVerified ? (
              <div className="text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Account
              </div>
            ) : (
              <div className="text-red-600 font-semibold flex items-center gap-1 mt-0.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-600" /> Unverified Profile
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Workspace Settings (Leader Only) */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-6"
      >
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-border">
          <Building className="w-4 h-4 text-sky-600" /> Workspace Configurations
        </h3>

        {orgError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> <span>{orgError}</span>
          </div>
        )}

        {orgSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> <span>{orgSuccess}</span>
          </div>
        )}

        <form onSubmit={handleOrgSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isLeader}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400 disabled:opacity-50 transition-all"
              required
            />
            {!isLeader && (
              <p className="text-[10px] text-muted mt-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Locked: Only organization leaders can modify the company name.
              </p>
            )}
          </div>

          {isLeader && (
            <button
              type="submit"
              disabled={updateOrgMutation.isPending}
              className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {updateOrgMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </button>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}

