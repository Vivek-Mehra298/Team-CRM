'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  Layers, 
  MessageSquare, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Lock, 
  Zap, 
  Sparkles 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-sky-600" />,
      title: "Organization Isolation",
      desc: "Strict multi-tenant security guarantees your organization's data remains isolated and encrypted."
    },
    {
      icon: <Layers className="w-5 h-5 text-sky-600" />,
      title: "Interactive Kanban Pipeline",
      desc: "Drag-and-drop customers through custom-defined pipeline stages with real-time updates."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-sky-600" />,
      title: "Slack-style Team Chat",
      desc: "Real-time channels, direct messages, typing indicators, and emoji reactions with Socket.io."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-sky-600" />,
      title: "Leader Analytics",
      desc: "Monitor conversion rates, deals won, monthly growth, and individual sales rep performance."
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-sky-600" />,
      title: "Task Management",
      desc: "Track follow-ups, meetings, and deadlines with Today, Upcoming, and Overdue widgets."
    },
    {
      icon: <Activity className="w-5 h-5 text-sky-600" />,
      title: "Audit Logs & Timeline",
      desc: "Complete traceability with filterable historical logs and real-time activity timelines."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col justify-between selection:bg-sky-500/20">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl tracking-tight text-foreground">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500 flex items-center justify-center text-black font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/10">
              T
            </div>
            <span>Team<span className="text-sky-600">CRM</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#mockup" className="hover:text-foreground transition-colors">Dashboard</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Metrics</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 h-8 sm:h-9 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-md shadow-sky-600/10"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs sm:text-sm font-semibold text-muted hover:text-foreground transition-colors px-1 py-1">
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 h-8 sm:h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative max-w-7xl mx-auto px-6 pt-20 md:pt-32 pb-16 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-600 text-xs font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Introducing TeamCRM v1.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1] mb-6"
          >
            Manage your customers. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
              Supercharge your sales.
            </span> Together.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A high-performance, real-time workspace built for modern sales organizations. Keep your data isolated, collaborate instantly, and close deals faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/10 text-base"
              >
                Go to Workspace <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/10 text-base"
                >
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 bg-card hover:bg-slate-50 text-foreground font-semibold rounded-xl border border-border transition-all text-base shadow-sm"
                >
                  Schedule Demo
                </Link>
              </>
            )}
          </motion.div>

          {/* Floating Mockup Card */}
          <motion.div
            id="mockup"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 50 }}
            className="relative max-w-5xl mx-auto rounded-xl border border-border bg-card shadow-2xl overflow-hidden group"
          >
            <div className="h-10 border-b border-border px-4 flex items-center justify-between bg-background">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                <div className="w-3 h-3 rounded-full bg-green-400/50" />
              </div>
              <div className="text-xs text-muted font-mono">app.teamcrm.com/dashboard/pipeline</div>
              <div className="w-8" />
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-left select-none pointer-events-none bg-background/50">
              {/* Mock Kanban Lane 1 */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Lead</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background border border-border text-muted font-mono">3</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-md bg-card border border-border shadow-sm">
                    <div className="text-xs font-semibold text-foreground">Acme Corp</div>
                    <div className="text-[10px] text-muted">Johnathan Doe</div>
                  </div>
                  <div className="p-3 rounded-md bg-card border border-border shadow-sm opacity-60">
                    <div className="text-xs font-semibold text-foreground">Delta Inc</div>
                    <div className="text-[10px] text-muted">Sarah Jenkins</div>
                  </div>
                </div>
              </div>

              {/* Mock Kanban Lane 2 */}
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-600" /> Negotiation
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 font-mono">1</span>
                </div>
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="p-3 rounded-md bg-card border border-sky-500/30 shadow-lg shadow-sky-500/5"
                >
                  <div className="text-xs font-semibold text-foreground flex justify-between">
                    Stripe Ltd <span className="text-[10px] text-sky-600 font-mono font-bold">$45,000</span>
                  </div>
                  <div className="text-[10px] text-muted">Alex Rivera</div>
                  <div className="mt-2 flex gap-1">
                    <span className="text-[8px] px-1 py-0.5 rounded bg-sky-500/10 text-sky-600 font-bold">Enterprise</span>
                  </div>
                </motion.div>
              </div>

              {/* Mock Kanban Lane 3 */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Proposal Sent</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background border border-border text-muted font-mono">2</span>
                </div>
                <div className="p-3 rounded-md bg-card border border-border shadow-sm">
                  <div className="text-xs font-semibold text-foreground">Vercel Inc</div>
                  <div className="text-[10px] text-muted">Guillermo Rauch</div>
                </div>
              </div>

              {/* Mock Chat / Activity Feed */}
              <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-muted mb-3">#general</div>
                  <div className="space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-[10px] font-bold flex items-center justify-center text-white">AR</div>
                      <div>
                        <div className="text-[10px] font-bold text-foreground">Alex Rivera <span className="text-[8px] text-muted font-normal">10:45 AM</span></div>
                        <div className="text-[10px] text-muted">Just moved Stripe to Negotiation! 🚀</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-bold flex items-center justify-center text-white">JD</div>
                      <div>
                        <div className="text-[10px] font-bold text-foreground">John Doe <span className="text-[8px] text-muted font-normal">10:46 AM</span></div>
                        <div className="text-[10px] text-muted">Awesome work, Alex! Let's close it.</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-6 rounded bg-background border border-border px-2 flex items-center justify-between text-[9px] text-gray-400">
                  Message #general...
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Enterprise-grade Foundation</h2>
            <p className="text-muted max-w-xl mx-auto text-base">
              A comprehensive system custom-designed for SaaS companies needing complete security, collaboration, and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-6 rounded-xl border border-border bg-card hover:border-slate-300 hover:shadow-lg transition-all hover:translate-y-[-2px] duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center mb-4 group-hover:border-sky-500/20 group-hover:bg-sky-500/5 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="max-w-7xl mx-auto px-6 py-20 border-t border-border text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-4">
              <div className="text-3xl md:text-5xl font-extrabold text-foreground mb-2 font-mono">1.2M+</div>
              <div className="text-xs text-muted uppercase tracking-wider font-bold">Leads Managed</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-5xl font-extrabold text-sky-600 mb-2 font-mono">99.99%</div>
              <div className="text-xs text-muted uppercase tracking-wider font-bold">Uptime</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-5xl font-extrabold text-foreground mb-2 font-mono">4.9/5</div>
              <div className="text-xs text-muted uppercase tracking-wider font-bold">Client Rating</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-5xl font-extrabold text-sky-600 mb-2 font-mono">&lt;200ms</div>
              <div className="text-xs text-muted uppercase tracking-wider font-bold">API Latency</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-black font-extrabold text-xs">
              T
            </div>
            TeamCRM
          </div>
          <div>© {new Date().getFullYear()} TeamCRM. Built for Google DeepMind Coding Challenge.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
