'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Loader2, 
  Building, 
  User, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Tag,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  { id: 'lead', name: 'Lead', color: 'border-l-slate-400 bg-slate-500/5' },
  { id: 'contacted', name: 'Contacted', color: 'border-l-blue-500 bg-blue-500/5' },
  { id: 'qualified', name: 'Qualified', color: 'border-l-indigo-500 bg-indigo-500/5' },
  { id: 'proposal_sent', name: 'Proposal Sent', color: 'border-l-purple-500 bg-purple-500/5' },
  { id: 'negotiation', name: 'Negotiation', color: 'border-l-yellow-500 bg-yellow-500/5' },
  { id: 'won', name: 'Won', color: 'border-l-emerald-500 bg-emerald-500/5' },
  { id: 'lost', name: 'Lost', color: 'border-l-red-500 bg-red-500/5' }
];

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null);

  // 1. Fetch all customers in organization
  const { data: listData, isLoading } = useQuery({
    queryKey: ['customers', 'pipeline'],
    queryFn: () => apiFetch('/customers?limit=100'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      apiFetch(`/customers/${args.id}`, { method: 'PATCH', bodyData: { status: args.status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });

  // Drag and Drop Event Handlers
  const handleDragStart = (e: any, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setActiveDragId(id);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setActiveDragColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (activeDragColumn !== columnId) {
      setActiveDragColumn(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const customer = customers.find((c: any) => c._id === id);
    if (customer && customer.status !== targetColumnId) {
      updateStatusMutation.mutate({ id, status: targetColumnId });
    }

    handleDragEnd();
  };

  const customers = listData?.customers || [];

  const getColumnCustomers = (colId: string) => {
    return customers.filter((c: any) => c.status === colId);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-10rem)] select-none text-left">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Kanban Sales Pipeline</h2>
        <p className="text-xs text-muted mt-0.5">Drag-and-drop customer cards to transition deal stages in real-time.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-grow">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4 no-scrollbar items-stretch min-h-0">
          {COLUMNS.map((col) => {
            const colCustomers = getColumnCustomers(col.id);
            const isDraggingOver = activeDragColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setActiveDragColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 shrink-0 flex flex-col rounded-xl border transition-all p-4 min-h-full ${
                  isDraggingOver 
                    ? 'bg-sky-500/5 border-sky-500/30 border-dashed border-2 shadow-inner' 
                    : 'bg-card border-border shadow-sm'
                }`}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 border-l-2 pl-2.5 h-6 shrink-0 border-l-sky-500">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {col.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                    {colCustomers.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-grow space-y-3 overflow-y-auto no-scrollbar pb-10">
                  {colCustomers.length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-gray-400 border border-dashed border-border rounded-lg bg-background/50">
                      No deals here
                    </div>
                  ) : (
                    colCustomers.map((cust: any) => (
                      <motion.div
                        key={cust._id}
                        layoutId={cust._id}
                        draggable={user?.role !== 'viewer'}
                        onDragStart={(e: any) => handleDragStart(e, cust._id)}
                        onDragEnd={() => handleDragEnd()}
                        whileHover={{ y: -3, scale: 1.01 }}
                        className={`p-3.5 rounded-lg border bg-card border-border hover:border-slate-300 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing text-left space-y-3 relative group ${
                          activeDragId === cust._id ? 'opacity-30' : ''
                        }`}
                      >
                        {/* Name and Link */}
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center justify-between">
                            <Link href={`/dashboard/customers?id=${cust._id}`} className="hover:underline text-sky-600 hover:text-sky-700">
                              {cust.name}
                            </Link>
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-muted" /> {cust.company || 'Private customer'}
                          </div>
                        </div>

                        {/* Card metadata details */}
                        <div className="flex items-center justify-between border-t border-border pt-2.5 text-[9px] text-muted">
                          <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                            {cust.assignedMemberId ? (
                              <>
                                <div className="w-4 h-4 rounded bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-[8px] shrink-0">
                                  {cust.assignedMemberId.name[0]}
                                </div>
                                <span className="truncate">{cust.assignedMemberId.name}</span>
                              </>
                            ) : (
                              <span className="italic text-gray-400">Unassigned</span>
                            )}
                          </div>
                          
                          <div className="font-mono text-gray-400">
                            {new Date(cust.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        {/* Tags list */}
                        {cust.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cust.tags.slice(0, 2).map((t: string) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-background border border-border text-[8px] text-muted">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
