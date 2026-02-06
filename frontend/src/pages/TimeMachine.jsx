import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useSandbox } from "@/context/SandboxContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from "recharts";
import {
  Loader2, RefreshCw, Zap, TrendingUp, TrendingDown, Target, Sparkles,
  ArrowRight, Clock, Shield, BarChart3, Wallet, PiggyBank, Flame, Eye,
  ChevronRight, Rocket, AlertTriangle, CheckCircle2, DollarSign, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];
const NEON_PIE = ["#00f0ff", "#bf5af2", "#30d158", "#ff453a", "#ffd60a", "#64d2ff"];

const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmtLakh = (v) => {
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

const TimeMachine = () => {
  const { user } = useUser();
  const { simulationData, loading: ctxLoading, regenerate, fetchSimulationData } = useSandbox();
  const navigate = useNavigate();

  const [localData, setLocalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("optimized"); // 'optimized' | 'current'

  // Load data on mount — use context data or fetch independently
  useEffect(() => {
    if (simulationData?.projections?.dashboardCards) {
      setLocalData(simulationData);
      setLoading(false);
    } else if (user?.uid) {
      loadData();
    }
  }, [user, simulationData]);

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/future/time-machine/${user.uid}`);
      if (res.data?.data?.projections?.dashboardCards) {
        setLocalData(res.data.data);
      } else {
        setLocalData(null);
      }
    } catch (err) {
      console.error("TM fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user?.uid) return;
    setGenerating(true);
    try {
      toast.info("Generating your 10-year financial projection...");
      const res = await axios.post(`${API_URL}/api/future/time-machine/generate`, {
        firebaseUid: user.uid,
      });
      const data = res.data?.data;
      setLocalData(data);
      toast.success("Time Machine projection ready!");
    } catch (err) {
      console.error("TM generate error:", err);
      toast.error("Failed to generate projection. Check backend/API key.");
    } finally {
      setGenerating(false);
    }
  };

  const data = localData;
  const proj = data?.projections;
  const analysis = data?.analysis;
  const cards = proj?.dashboardCards;
  const ob = proj?.originalBudget;

  // ─── Chart data builders ───
  const wealthTimeline = proj ? proj.currentPath.map((c, i) => ({
    year: c.year,
    "Current Habits": c.netWorth,
    "Optimized Path": proj.optimizedPath[i].netWorth,
  })) : [];

  const savingsTimeline = proj ? proj.currentPath.map((c, i) => ({
    year: c.year,
    "Current": c.savings,
    "Optimized": proj.optimizedPath[i].savings,
  })) : [];

  const debtTimeline = proj ? proj.currentPath.map((c, i) => ({
    year: c.year,
    "Current": c.debt,
    "Optimized": proj.optimizedPath[i].debt,
  })) : [];

  const budgetCompare = ob ? Object.keys(ob.today).map((k) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    Current: ob.today[k],
    Optimized: ob.todayOptimized[k],
  })) : [];

  const currentPie = cards ? Object.entries(cards.current.budgetBreakdown)
    .filter(([, v]) => v > 0).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })) : [];
  const optimizedPie = cards ? Object.entries(cards.optimized.budgetBreakdown)
    .filter(([, v]) => v > 0).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })) : [];

  const wealthGap = proj?.metrics?.wealthGap || 0;
  const currentNW = proj?.metrics?.currentNetWorthProjection || 0;
  const optimizedNW = proj?.metrics?.optimizedNetWorthProjection || 0;

  // ─── Loading state ───
  if (loading || ctxLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 pt-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => (<Card key={i}><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-8 w-40" /></CardContent></Card>))}</div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // ─── No data state ───
  if (!data) {
    return (
      <div className="flex-1 p-6 pt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center py-20">
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto border border-purple-500/30">
              <Clock className="w-16 h-16 text-purple-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center animate-bounce">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4">Financial Time Machine</h1>
          <p className="text-lg text-muted-foreground mb-2">See where your money takes you in 10 years</p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Our AI analyzes your income, expenses, debt, and savings to project two possible futures:
            your <span className="text-red-400 font-semibold">current trajectory</span> vs an{" "}
            <span className="text-purple-400 font-semibold">optimized path</span>.
          </p>
          <Button size="lg" onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/25 text-lg px-8 py-6">
            {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
            {generating ? "Calculating 2036..." : "Launch Time Machine"}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  MAIN RENDER — DATA EXISTS
  // ═══════════════════════════════════════════
  return (
    <div className="flex-1 space-y-8 p-6 pt-4 pb-20 min-h-screen relative">
      {/* ─── Subtle bg effect ─── */}
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)]" />
      </div>

      {/* ═══ HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <Clock className="w-7 h-7 text-purple-400" />
            </div>
            Financial Time Machine
          </h1>
          <p className="text-muted-foreground mt-1">Your 10-year projection — 2026 → 2036</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </Button>
      </motion.div>

      {/* ═══ WEALTH GAP HERO ═══ */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 text-white shadow-2xl shadow-purple-500/10">
          <CardContent className="p-8 md:p-10">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center md:text-left">
                <p className="text-xs uppercase tracking-widest text-red-400 font-bold mb-1">Current Habits</p>
                <p className="text-3xl font-black text-red-400">{fmtLakh(currentNW)}</p>
                <p className="text-xs text-gray-400 mt-1">Net worth in 2036</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">THE GAP</p>
                <p className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  {fmtLakh(wealthGap)}
                </p>
                {analysis?.wealth_gap_highlight && (
                  <p className="text-sm text-gray-300 mt-3 max-w-xs mx-auto italic">"{analysis.wealth_gap_highlight}"</p>
                )}
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Optimized Path</p>
                <p className="text-3xl font-black text-emerald-400">{fmtLakh(optimizedNW)}</p>
                <p className="text-xs text-gray-400 mt-1">Net worth in 2036</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ OPTIMIZED PLAN STEPS (at the top as requested) ═══ */}
      {analysis?.optimized_plan_steps && analysis.optimized_plan_steps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border border-emerald-500/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-emerald-500/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                Your Optimized Financial Plan
              </CardTitle>
              <CardDescription>Follow these strategies to unlock {fmtLakh(wealthGap)} in additional wealth by 2036</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analysis.optimized_plan_steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.08 }}
                  >
                    <Card className="h-full border-l-4 border-l-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{step.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{step.action}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-cyan-500 font-medium bg-cyan-500/5 px-2 py-1.5 rounded-md border border-cyan-500/10">
                          <TrendingUp className="w-3 h-3" />
                          {step.impact}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ QUICK STAT CARDS ═══ */}
      {cards && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {/* Tab toggle */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm font-medium text-muted-foreground">Viewing:</p>
            <div className="flex bg-muted rounded-full p-1">
              <button
                onClick={() => setActiveTab("optimized")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "optimized" ? "bg-emerald-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Zap className="w-3 h-3 inline mr-1" />Optimized 2036
              </button>
              <button
                onClick={() => setActiveTab("current")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "current" ? "bg-red-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                Current 2036
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Monthly Income"
              value={fmt(cards[activeTab].monthlyIncome)}
              icon={<DollarSign className="w-4 h-4" />}
              color="green"
              sub={activeTab === "optimized" ? "Same income, smarter spending" : "Inflation-adjusted"}
            />
            <StatCard
              title="Monthly Expenses"
              value={fmt(cards[activeTab].monthlyExpenses)}
              icon={<Wallet className="w-4 h-4" />}
              color="red"
              sub={activeTab === "optimized" ? "15% flexible expenses cut" : "Current habits projected"}
            />
            <StatCard
              title="Total Savings"
              value={fmtLakh(cards[activeTab].savings)}
              icon={<PiggyBank className="w-4 h-4" />}
              color="purple"
              sub={activeTab === "optimized" ? "12% growth returns" : "3.5% savings rate"}
            />
            <StatCard
              title="Net Worth"
              value={fmtLakh(cards[activeTab].netWorth)}
              icon={<TrendingUp className="w-4 h-4" />}
              color="cyan"
              sub={activeTab === "optimized" ? "Debt-free + compounded" : "Savings minus debt"}
            />
          </div>
        </motion.div>
      )}

      {/* ═══ CHARTS SECTION ═══ */}
      <div className="space-y-8">
        {/* 10-Year Net Worth Timeline */}
        {wealthTimeline.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-500" /> 10-Year Net Worth Projection</CardTitle>
                <CardDescription>How your net worth evolves under both scenarios</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={wealthTimeline}>
                    <defs>
                      <linearGradient id="tmCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tmOptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => fmtLakh(v)} />
                    <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => [fmt(v)]} />
                    <Area type="monotone" dataKey="Current Habits" stroke="#ef4444" fill="url(#tmCurrentGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Optimized Path" stroke="#10b981" fill="url(#tmOptGrad)" strokeWidth={2.5} strokeDasharray="" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Savings + Debt side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {savingsTimeline.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="h-full">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base"><PiggyBank className="w-4 h-4 text-emerald-500" /> Savings Growth</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={savingsTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => fmtLakh(v)} />
                      <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => [fmt(v)]} />
                      <Area type="monotone" dataKey="Current" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="Optimized" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {debtTimeline.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <Card className="h-full">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base"><Flame className="w-4 h-4 text-red-500" /> Debt Reduction</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={debtTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => fmtLakh(v)} />
                      <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => [fmt(v)]} />
                      <Area type="monotone" dataKey="Current" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="Optimized" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Budget Comparison: Today vs Optimized bar + Pie charts */}
        {ob && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Budget Optimization Breakdown</CardTitle>
                <CardDescription>Where you save money — Current vs Optimized monthly spending (today's values)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-8 lg:grid-cols-5">
                  {/* Bar chart */}
                  <div className="lg:col-span-3">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetCompare} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(v) => `₹${v}`} />
                        <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v) => [fmt(v)]} />
                        <Bar dataKey="Current" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Optimized" fill="#10b981" radius={[6, 6, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary side panel */}
                  <div className="lg:col-span-2 flex flex-col justify-center gap-4">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-xs uppercase tracking-wider text-red-400 font-bold">Current Monthly</p>
                      <p className="text-2xl font-black text-red-500 mt-1">{fmt(ob.todayTotal)}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Optimized Monthly</p>
                      <p className="text-2xl font-black text-emerald-500 mt-1">{fmt(ob.todayOptimizedTotal)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                      <p className="text-xs uppercase tracking-wider text-purple-400 font-bold">Monthly Savings Unlocked</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mt-1">
                        {fmt(ob.monthlySavingsUnlocked)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">That's {fmt(ob.monthlySavingsUnlocked * 12)}/year extra</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2036 Expense Pie: Current vs Optimized side by side */}
        {(currentPie.length > 0 || optimizedPie.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <Card className="border-t-4 border-t-red-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> 2036 Expenses — Current Habits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={currentPie} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${fmtLakh(value)}`} labelLine={false}>
                        {currentPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Card className="border-t-4 border-t-emerald-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2036 Expenses — Optimized
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={optimizedPie} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${fmtLakh(value)}`} labelLine={false}>
                        {optimizedPie.map((_, i) => <Cell key={i} fill={NEON_PIE[i % NEON_PIE.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>

      {/* ═══ AI NARRATIVE SECTION ═══ */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" /> AI Intelligence Report
              </CardTitle>
              <CardDescription>Two possible futures — which one will you choose?</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                {/* Dystopian — Current Path */}
                <div className="p-6 md:border-r border-b md:border-b-0 bg-gradient-to-b from-red-950/10 to-transparent">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-red-400">Current Trajectory — 2036</h4>
                  </div>
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/15">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{analysis.narrative_current}"
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Net Worth</p>
                      <p className="text-lg font-bold text-red-500">{fmtLakh(currentNW)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Expenses/mo</p>
                      <p className="text-lg font-bold text-red-500">{cards ? fmt(cards.current.monthlyExpenses) : "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Cyberpunk — Optimized Path */}
                <div className="p-6 bg-gradient-to-b from-emerald-950/10 to-transparent">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Optimized Future — 2036</h4>
                  </div>
                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15">
                    <p className="text-sm leading-relaxed">
                      "{analysis.narrative_future}"
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-muted-foreground">Net Worth</p>
                      <p className="text-lg font-bold text-emerald-500">{fmtLakh(optimizedNW)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-muted-foreground">Expenses/mo</p>
                      <p className="text-lg font-bold text-emerald-500">{cards ? fmt(cards.optimized.monthlyExpenses) : "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ TIPS ═══ */}
      {analysis?.future_tips && analysis.future_tips.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-500" /> Pro Tips from the Future</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.future_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-cyan-500">
                      {i + 1}
                    </div>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ CTA ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="text-center py-6">
        <p className="text-muted-foreground text-sm mb-4">Ready to optimize your finances?</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/agent/budget")} className="gap-2">
            <Wallet className="w-4 h-4" /> Budget Agent
          </Button>
          <Button variant="outline" onClick={() => navigate("/agent/savings")} className="gap-2">
            <PiggyBank className="w-4 h-4" /> Savings Agent
          </Button>
          <Button variant="outline" onClick={() => navigate("/agent/investment")} className="gap-2">
            <TrendingUp className="w-4 h-4" /> Investment Scout
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Reusable stat card ───
const StatCard = ({ title, value, icon, color, sub }) => {
  const colorMap = {
    green: "border-l-green-500 text-green-600",
    red: "border-l-red-500 text-red-600",
    purple: "border-l-purple-500 text-purple-600",
    cyan: "border-l-cyan-500 text-cyan-600",
    blue: "border-l-blue-500 text-blue-600",
  };
  const iconColor = {
    green: "text-green-500", red: "text-red-500", purple: "text-purple-500", cyan: "text-cyan-500", blue: "text-blue-500",
  };
  return (
    <Card className={`border-l-4 ${colorMap[color]?.split(" ")[0] || ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className={iconColor[color]}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorMap[color]?.split(" ")[1] || ""}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
};

export default TimeMachine;
