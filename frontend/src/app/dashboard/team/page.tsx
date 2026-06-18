'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Loader2,
  Mail,
  Trash2,
  Shield,
  X
} from 'lucide-react';

export default function TeamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('executive');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // 1. Guard check: only leaders and managers should view this page
  useEffect(() => {
    if (user && user.role !== 'leader' && user.role !== 'manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // 2. Fetch Team members with stats
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members', 'dashboard-list'],
    queryFn: () => apiFetch('/org/members'),
  });

  const inviteMutation = useMutation({
    mutationFn: (newInvite: { email: string; role: string }) =>
      apiFetch('/org/invite', { method: 'POST', bodyData: newInvite }),
    onSuccess: () => {
      setInviteSuccess('Invitation logged! The mock email link is visible in your server console logs.');
      setInviteEmail('');
      setInviteRole('executive');
    },
    onError: (err: any) => {
      setInviteError(err.message || 'Failed to send invitation.');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/org/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: (args: { id: string; role: string }) =>
      apiFetch(`/org/members/${args.id}/role`, { method: 'PATCH', bodyData: { role: args.role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    }
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!inviteEmail) return;

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to remove ${name} from your organization? All their pending tasks will be deleted, and assigned customers will be set to unassigned.`)) {
      deleteMemberMutation.mutate(id);
    }
  };

  const handleChangeRole = (id: string, role: string) => {
    changeRoleMutation.mutate({ id, role });
  };

  const members = membersData?.members || [];
  const isLeader = user?.role === 'leader';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground font-sans">Team Management</h2>
          <p className="text-xs text-muted mt-0.5">Invite sales reps, assign workspace roles, and track performance indicators.</p>
        </div>

        <button
          onClick={() => { setInviteError(''); setInviteSuccess(''); setIsInviteOpen(true); }}
          className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member: any) => {
            const stats = member.stats || { assignedCustomers: 0, totalTasks: 0, completedTasks: 0, wonCustomers: 0 };
            const isSelf = member._id === user?.id;

            return (
              <motion.div
                key={member._id}
                whileHover={{ y: -3 }}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between relative overflow-hidden shadow-sm"
              >
                {isSelf && (
                  <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-sky-500/10 border-l border-b border-sky-500/20 text-sky-600 font-mono text-[8px] font-bold">
                    YOU
                  </span>
                )}

                {/* Member Profile */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-sky-600 font-extrabold text-sm uppercase">
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{member.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Shield className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">{member.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted space-y-1 border-t border-border py-3 leading-relaxed">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted" /> {member.email}</div>
                  </div>

                  {/* Stats aggregates */}
                  <div className="grid grid-cols-3 gap-2 bg-background/50 border border-border p-3 rounded-lg text-center mt-2 mb-4">
                    <div>
                      <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Assigned</div>
                      <div className="text-base font-extrabold text-foreground mt-0.5 font-mono">{stats.assignedCustomers}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Won</div>
                      <div className="text-base font-extrabold text-emerald-600 mt-0.5 font-mono">{stats.wonCustomers}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Tasks Done</div>
                      <div className="text-base font-extrabold text-indigo-600 mt-0.5 font-mono">
                        {stats.completedTasks}/{stats.totalTasks}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administration Options */}
                {isLeader && !isSelf && (
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted font-bold uppercase">Role:</span>
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member._id, e.target.value)}
                        className="h-7 px-2 rounded border border-border bg-background text-foreground text-[10px] focus:border-sky-500 focus:outline-none capitalize"
                      >
                        <option value="leader">Leader</option>
                        <option value="manager">Manager</option>
                        <option value="executive">Executive</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      className="w-7 h-7 rounded hover:bg-red-50 hover:text-white border border-transparent hover:border-red-100 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      <AnimatePresence>
        {isInviteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-card border border-border rounded-xl shadow-2xl p-6 z-50"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Invite Team Member</h3>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteError && <div className="text-xs text-red-500 mb-3 font-semibold">{inviteError}</div>}
              {inviteSuccess && <div className="text-xs text-emerald-600 mb-3 font-semibold">{inviteSuccess}</div>}

              {!inviteSuccess && (
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="rep@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Workspace Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none capitalize"
                    >
                      <option value="leader">Leader (Admin access)</option>
                      <option value="manager">Manager (CRUD + assignments)</option>
                      <option value="executive">Sales Executive (Own CRUD only)</option>
                      <option value="viewer">Viewer (Read-only views)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="w-full h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-sky-600/10 cursor-pointer"
                  >
                    {inviteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
                  </button>
                </form>
              )}

              {inviteSuccess && (
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full h-9 rounded-lg bg-background hover:bg-slate-50 text-foreground border border-border text-xs font-semibold cursor-pointer"
                >
                  Close Panel
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
