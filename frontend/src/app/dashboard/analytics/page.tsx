'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Loader2,
  TrendingUp,
  Award,
  CheckCircle2,
  Users,
  Target,
  BarChart3
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // 1. Guard check: Only leader and manager roles can view
  useEffect(() => {
    setMounted(true);
    if (user && user.role !== 'leader' && user.role !== 'manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // 2. Fetch analytics summary
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'full-page'],
    queryFn: () => apiFetch('/analytics'),
    enabled: mounted,
  });

  if (!mounted || isLoading || !analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const { summary } = analyticsData;
  const growthData = summary.monthlyGrowth || [];
  const performanceData = summary.teamPerformance || [];

  return (
    <div className="space-y-8 select-none text-left">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Sales & Team Analytics</h2>
        <p className="text-xs text-muted mt-0.5">Evaluate monthly growth, conversions, and sales executive efficiencies.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Listings</span>
            <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.totalCustomers}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-center justify-center text-sky-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Deals</span>
            <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.activeLeads}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-center text-yellow-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Deals Closed Won</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{summary.wonDeals}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Win Rate</span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1 font-mono">{summary.conversionRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-sky-600" /> Monthly Growth Trend (leads vs won)
          </h3>
          <div className="h-72 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" name="Leads Created" dataKey="leads" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" name="Deals Won" dataKey="dealsWon" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Won deals by sales rep Bar Chart */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-sky-600" /> Won Deals by Executive
          </h3>
          <div className="h-72 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tickLine={false} />
                <YAxis stroke="#64748B" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }} />
                <Bar name="Closed Won count" dataKey="won" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-sky-600" /> Team Performance Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-slate-500 font-bold">
                <th className="pb-3 pt-1">Rank</th>
                <th className="pb-3 pt-1">Executive Name</th>
                <th className="pb-3 pt-1">Role</th>
                <th className="pb-3 pt-1 text-center">Assigned Leads</th>
                <th className="pb-3 pt-1 text-center">Deals Won</th>
                <th className="pb-3 pt-1 text-center">Conversion</th>
                <th className="pb-3 pt-1 text-right">Tasks Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-slate-700">
              {performanceData.map((member: any, index: number) => (
                <tr key={member.id} className="hover:bg-slate-55 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-400">{index + 1}</td>
                  <td className="py-3 font-bold text-foreground flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-[8px] uppercase">
                      {member.name[0]}
                    </div>
                    {member.name}
                  </td>
                  <td className="py-3 uppercase text-[9px] tracking-wider text-muted font-semibold">{member.role}</td>
                  <td className="py-3 text-center font-mono">{member.assigned}</td>
                  <td className="py-3 text-center text-emerald-600 font-mono font-bold">{member.won}</td>
                  <td className="py-3 text-center font-mono font-bold">{member.conversion}%</td>
                  <td className="py-3 text-right font-mono text-indigo-600">{member.tasksCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
