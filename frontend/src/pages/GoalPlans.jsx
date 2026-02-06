import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Loader2,
  Plus,
  Target,
  TrendingUp,
  MapPin,
  DollarSign,
  Trophy,
  Star,
  Flame,
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function getGoalProgress(goal) {
  const target = Math.max(0, toNumber(goal.targetAmount));
  const current = Math.max(0, toNumber(goal.currentAmount));
  if (target <= 0) return 0;
  return clampNumber(Math.round((current / target) * 100), 0, 100);
}

function getTimePlan(goal, now) {
  const target = Math.max(0, toNumber(goal.targetAmount));
  const current = Math.max(0, toNumber(goal.currentAmount));
  const remaining = Math.max(0, target - current);
  const deadline = safeDate(goal.deadline);

  if (!deadline || remaining <= 0) {
    return {
      remaining,
      deadline,
      daysLeft: null,
      perWeek: null,
      perMonth: null,
      status: remaining <= 0 ? "done" : "no-deadline",
    };
  }

  const daysLeft = differenceInCalendarDays(deadline, now);
  if (daysLeft <= 0) {
    return {
      remaining,
      deadline,
      daysLeft,
      perWeek: remaining,
      perMonth: remaining,
      status: "overdue",
    };
  }

  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const perWeek = Math.ceil(remaining / weeksLeft);
  const perMonth = Math.ceil(remaining / monthsLeft);

  const status = daysLeft <= 14 ? "tight" : "on-track";
  return { remaining, deadline, daysLeft, perWeek, perMonth, status };
}

function normalizeGoals(payload) {
  const short = payload?.data?.shortTermGoals || [];
  const long = payload?.data?.longTermGoals || [];

  const mapOne = (g, goalType) => ({
    ...g,
    goalType,
    deadline: g.deadline ? new Date(g.deadline) : null,
  });

  return {
    short: short.map((g) => mapOne(g, "shortTerm")),
    long: long.map((g) => mapOne(g, "longTerm")),
  };
}

function buildMonthDays(cursorDate) {
  const monthStart = startOfMonth(cursorDate);
  const monthEnd = endOfMonth(cursorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  return { monthStart, monthEnd, gridStart, gridEnd, days };
}

function buildEventsForMonth(goals, cursorDate) {
  const now = new Date();
  const { monthStart, monthEnd } = buildMonthDays(cursorDate);

  const events = [];

  for (const goal of goals) {
    if (goal.isCompleted) continue;

    const plan = getTimePlan(goal, now);
    const deadline = plan.deadline;

    if (!deadline) {
      // Keep the calendar meaningful even when users haven't set deadlines.
      // Show a gentle reminder on the first day of the visible month.
      events.push({
        id: `${goal.goalType}:${goal.id}:set-deadline:${format(monthStart, "yyyy-MM-dd")}`,
        date: monthStart,
        kind: "set-deadline",
        title: `Set deadline: ${goal.title}`,
        subtitle: "Add a deadline to generate weekly savings tasks",
        goal,
      });
    }

    if (deadline && deadline >= monthStart && deadline <= monthEnd) {
      events.push({
        id: `${goal.goalType}:${goal.id}:deadline`,
        date: deadline,
        kind: "deadline",
        title: `Deadline: ${goal.title}`,
        subtitle: plan.remaining > 0 ? `Remaining ₹${plan.remaining.toLocaleString()}` : "Done",
        goal,
      });
    }

    if (!deadline || !plan.perWeek || plan.remaining <= 0) continue;

    // Weekly savings tasks for the visible month.
    // Short-term goals: show weekly tasks on Monday (weekStartsOn:1).
    // Long-term goals: show weekly tasks on Sunday (weekStartsOn:0).
    const weekStart = goal.goalType === 'longTerm' ? 0 : 1;
    let d = startOfWeek(monthStart, { weekStartsOn: weekStart });
    while (d <= monthEnd) {
      if (d >= monthStart && d <= monthEnd) {
        events.push({
          id: `${goal.goalType}:${goal.id}:weekly:${format(d, "yyyy-MM-dd")}`,
          date: d,
          kind: "save",
          title: `Save for ${goal.title}`,
          subtitle: `This week: ₹${plan.perWeek.toLocaleString()}`,
          amount: plan.perWeek,
          goal,
        });
      }
      d = addDays(d, 7);
    }
  }

  return events;
}

function groupEventsByDay(events) {
  const map = new Map();
  for (const ev of events) {
    const key = format(ev.date, "yyyy-MM-dd");
    const list = map.get(key) || [];
    list.push(ev);
    map.set(key, list);
  }
  return map;
}

// New Component: Visual Goals Analysis (Zero Text Style)
function GoalAnalysisSection({ goal }) {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchAnalysis = async () => {
      // Generate cache key based on goal ID and current amount
      const cacheKey = `goal_analysis_${goal.goalType}_${goal.id}_${goal.currentAmount}_${goal.targetAmount}`;
      
      // Check sessionStorage first
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheTime = parsed.timestamp || 0;
          const now = Date.now();
          // Cache valid for 5 minutes
          if (now - cacheTime < 5 * 60 * 1000) {
            setData(parsed.data);
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached data", e);
        }
      }

      // If no cache or expired, fetch from API
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(`${API_URL}/api/goal-analysis/analyze-goal`, {
          goal,
          firebaseUid: user.uid
        });
        setData(res.data);
        
        // Cache the response
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: res.data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Failed to cache data", e);
        }
      } catch (e) {
        console.error("Failed to analyze goal", e);
        setError("Unable to load insights");
      } finally {
        setLoading(false);
      }
    };

    if (goal.targetAmount > 0 && user?.uid) {
      fetchAnalysis();
    }
  }, [goal, user?.uid]);

  if (loading) {
    return (
      <div className="p-6 bg-muted/20 rounded-lg border border-primary/10 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-muted/10 rounded-lg border border-muted flex items-center justify-center min-h-[300px]">
        <span className="text-sm text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-muted/10 rounded-lg border border-muted flex items-center justify-center min-h-[300px]">
        <span className="text-sm text-muted-foreground">No data available</span>
      </div>
    );
  }

  const ringData = [{
      name: 'progress',
      value: Math.min(100, (goal.currentAmount / goal.targetAmount) * 100),
      fill: data.forecastStatus === 'At Risk' ? 'hsl(var(--destructive))' : data.forecastStatus === 'Ahead' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))'
  }];

  const statusConfig = {
    'On Track': { 
      color: 'hsl(var(--chart-1))', 
      textClass: 'text-[hsl(var(--chart-1))]',
      bgClass: 'bg-[hsl(var(--chart-1))]/10',
      badge: 'default'
    },
    'At Risk': { 
      color: 'hsl(var(--destructive))', 
      textClass: 'text-destructive',
      bgClass: 'bg-destructive/10',
      badge: 'destructive'
    },
    'Ahead': { 
      color: 'hsl(var(--chart-4))', 
      textClass: 'text-[hsl(var(--chart-4))]',
      bgClass: 'bg-[hsl(var(--chart-4))]/10',
      badge: 'secondary'
    }
  };

  const status = statusConfig[data.forecastStatus] || statusConfig['On Track'];

  // Weekly / streak logic: treat a single-week streak as 1 if any payment made
  const lastWeek = (data.weeklyData || []).length ? data.weeklyData[data.weeklyData.length - 1] : null;
  const currentWeekSaved = lastWeek ? toNumber(lastWeek.saved) : 0;
  const currentWeekTarget = lastWeek ? toNumber(lastWeek.target) : 0;
  const hasAnyPayment = toNumber(goal.currentAmount) > 0;
  const isHalfway = toNumber(goal.targetAmount) > 0 && toNumber(goal.currentAmount) / toNumber(goal.targetAmount) >= 0.5;
  const streakCount = hasAnyPayment ? 1 : 0;

  return (
    <div className="h-full flex flex-col p-3 bg-linear-to-br from-card via-card to-primary/5 rounded-lg border border-primary/15">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-primary/10">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          Goal Insights
        </h3>
        <Badge variant={status.badge} className="text-[10px] px-1.5 py-0.5">
          {data.forecastStatus}
        </Badge>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Box 1: Gauge Chart - Top Left */}
        <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-secondary/5 p-3 flex flex-col justify-center min-h-[140px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completion</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-purple-600 w-12 text-right">{Math.round(ringData[0].value)}%</span>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all" 
                  style={{ width: `${Math.round(ringData[0].value)}%` }}
                />
              </div>
            </div>
          </div>
          <p className={cn("text-xs font-bold mt-3", status.textClass)}>
            {data.forecastStatus}
          </p>
        </div>

        {/* Box 2: Projection Paths - Top Right */}
        <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-accent/5 p-3 flex flex-col min-h-[140px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Projection</p>
          <div className="h-12 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyData || []}>
                <defs>
                  <linearGradient id="colorAgg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--chart-2))" 
                  fillOpacity={1} 
                  fill="url(#colorAgg)" 
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="saved" 
                  stroke="hsl(var(--chart-1))" 
                  fillOpacity={1} 
                  fill="url(#colorCur)" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-1 px-0.5 text-[9px] text-muted-foreground">
            <span>Aggressive</span>
            <span>Current</span>
          </div>
        </div>

        {/* Box 3: Week streak - Bottom Left */}
        <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-orange/5 p-3 flex flex-col items-center justify-center min-h-[140px]">
          <div className="w-full text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Week streak</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{streakCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{hasAnyPayment ? "Weeks" : "no payments yet"}</p>
            </div>
          </div>
        </div>

        {/* Box 4: Achievements - Bottom Right */}
        <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-primary/5 p-3 flex flex-col items-center justify-between min-h-[140px]">
          <div className="w-full text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Achievements</p>
          </div>
            <div className="flex gap-2 mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border",
                    hasAnyPayment
                      ? "bg-linear-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/40"
                      : "bg-muted/30 border-muted/50"
                  )}>
                    <Trophy className={cn(
                      "size-4",
                      hasAnyPayment ? "text-amber-600" : "text-muted-foreground"
                    )} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[9px]">First Payments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border",
                    isHalfway
                      ? "bg-linear-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/40"
                      : "bg-muted/30 border-muted/50"
                  )}>
                    <Star className={cn(
                      "size-4",
                      isHalfway ? "text-emerald-600" : "text-muted-foreground"
                    )} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[9px]">50% done</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-full px-2 py-1.5 rounded-sm bg-linear-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center justify-between">
            <Flame className="size-4 text-orange-600" />
            <div className="flex-1 ml-1">
              <p className="text-[8px] text-muted-foreground">Streak</p>
              <p className="text-xs font-bold text-orange-600">
                {streakCount === 0 ? "0 weeks" : streakCount === 1 ? "1 week" : `${streakCount} weeks`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onUpdateAmount, onToggleDone }) {
  const now = new Date();
  const plan = getTimePlan(goal, now);
  const progress = getGoalProgress(goal);

  const statusPill = (() => {
    if (goal.isCompleted || plan.status === "done") {
      return { label: "Completed", className: "bg-green-500/10 text-green-600" };
    }
    if (plan.status === "overdue") {
      return { label: "Overdue", className: "bg-red-500/10 text-red-600" };
    }
    if (plan.status === "tight") {
      return { label: "High Priority", className: "bg-orange-500/10 text-orange-600" };
    }
    if (plan.status === "no-deadline") {
      return { label: "Set a deadline", className: "bg-muted text-muted-foreground" };
    }
    return { label: "On track", className: "bg-blue-500/10 text-blue-600" };
  })();

  return (
    <Card className="overflow-hidden border-primary/15 shadow-md hover:shadow-lg transition-shadow">
      {/* Goal Header */}
      <CardHeader className="pb-4 border-b border-primary/10">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Target className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <CardTitle className="text-lg font-semibold truncate">{goal.title}</CardTitle>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusPill.className)}>
                {statusPill.label}
              </span>
              <Badge variant="outline" className="text-xs">
                {goal.goalType === "shortTerm" ? "Short-term" : "Long-term"}
              </Badge>
            </div>
            {goal.description ? (
              <CardDescription className="text-sm line-clamp-2">{goal.description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {/* Goal Content: Left + Right Layout */}
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 h-full">
          {/* LEFT: Goal Details */}
          <div className="space-y-5">
            {/* Target & Saved */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-secondary/5 p-4">
                  <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">Target</p>
                  <p className="text-lg font-bold text-foreground mt-1">₹{Math.max(0, toNumber(goal.targetAmount)).toLocaleString()}</p>
                </div>
                <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-accent/5 p-4">
                  <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">Saved</p>
                  <p className="text-lg font-bold text-primary mt-1">₹{Math.max(0, toNumber(goal.currentAmount)).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</label>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>

            {/* Plan Details */}
            <div className="rounded-md border border-primary/10 bg-linear-to-br from-card to-primary/5 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Plan</p>
                {plan.deadline ? (
                  <p className="text-sm font-semibold text-foreground">By {format(plan.deadline, "MMM d, yyyy")}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Add a deadline for accuracy</p>
                )}
              </div>

              <Separator className="my-2.5 opacity-40" />

              {plan.perWeek ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Weekly Savings</p>
                    <p className={cn(
                      "text-sm font-bold mt-1",
                      plan.status === "overdue" ? "text-red-600" : plan.status === "tight" ? "text-orange-600" : "text-green-600"
                    )}>
                      ₹{plan.perWeek.toLocaleString()}/week
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Remaining</p>
                    <p className="text-sm font-bold mt-1">₹{plan.remaining.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Set target + deadline to get an automatic savings schedule.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onUpdateAmount(goal)}
                className="flex-1 text-xs"
              >
                Update saved
              </Button>
              <Button
                variant={goal.isCompleted ? "outline" : "default"}
                size="sm"
                onClick={() => onToggleDone(goal)}
                className="flex-1 gap-1.5 text-xs"
              >
                <CircleCheck className="size-3.5" />
                {goal.isCompleted ? "Mark active" : "Mark done"}
              </Button>
            </div>
          </div>

          {/* RIGHT: Goal Insights - Full Height */}
          <div className="min-h-full">
            <GoalAnalysisSection goal={goal} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalPlans() {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ short: [], long: [] });
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newSavedAmount, setNewSavedAmount] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: "shortTerm",
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    category: "savings",
    priority: "medium",
  });

  const allGoals = useMemo(() => [...goals.short, ...goals.long], [goals]);

  const month = useMemo(() => buildMonthDays(cursorDate), [cursorDate]);
  const monthEvents = useMemo(() => buildEventsForMonth(allGoals, cursorDate), [allGoals, cursorDate]);
  const eventsByDay = useMemo(() => groupEventsByDay(monthEvents), [monthEvents]);

  const selectedDayKey = useMemo(() => format(selectedDay, "yyyy-MM-dd"), [selectedDay]);
  const selectedEvents = useMemo(() => eventsByDay.get(selectedDayKey) || [], [eventsByDay, selectedDayKey]);

  const fetchGoals = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/student/goals/${user.uid}?includeCompleted=true`);
      const normalized = normalizeGoals(res.data);
      setGoals(normalized);
    } catch (err) {
      console.error("GoalPlans: fetch goals failed", err);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleUpdateAmount = (goal) => {
    setEditingGoal(goal);
    setNewSavedAmount(String(Math.max(0, toNumber(goal.currentAmount))));
    setUpdateDialogOpen(true);
  };

  const submitUpdateAmount = async () => {
    if (!editingGoal) return;
    setSavingUpdate(true);
    try {
      const updates = {
        currentAmount: Math.max(0, toNumber(newSavedAmount)),
      };

      const res = await axios.put(`${API_URL}/api/student/goals`, {
        firebaseUid: user.uid,
        goalType: editingGoal.goalType,
        goalId: editingGoal.id,
        updates,
      });

      if (res.data.success) {
        toast.success("Goal updated");
        setUpdateDialogOpen(false);
        setEditingGoal(null);
        fetchGoals();
      } else {
        toast.error(res.data.message || "Failed to update goal");
      }
    } catch (err) {
      console.error("GoalPlans: update goal failed", err);
      toast.error("Failed to update goal");
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleToggleDone = async (goal) => {
    try {
      const res = await axios.post(`${API_URL}/api/student/goals/toggle`, {
        firebaseUid: user.uid,
        goalType: goal.goalType,
        goalId: goal.id,
      });

      if (res.data.success) {
        toast.success(goal.isCompleted ? "Goal marked active" : "Goal completed");
        fetchGoals();
      } else {
        toast.error(res.data.message || "Failed to toggle goal");
      }
    } catch (err) {
      console.error("GoalPlans: toggle failed", err);
      toast.error("Failed to toggle goal");
    }
  };

  const submitNewGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/student/goals`, {
        firebaseUid: user.uid,
        goalType: newGoal.goalType,
        goal: {
          title: newGoal.title.trim(),
          description: newGoal.description.trim(),
          targetAmount: toNumber(newGoal.targetAmount),
          currentAmount: 0,
          deadline: newGoal.deadline ? new Date(newGoal.deadline) : null,
          category: newGoal.category,
          priority: newGoal.priority,
        },
      });

      if (res.data.success) {
        toast.success("Goal added");
        setAddDialogOpen(false);
        setNewGoal({
          goalType: "shortTerm",
          title: "",
          description: "",
          targetAmount: "",
          deadline: "",
          category: "savings",
          priority: "medium",
        });
        fetchGoals();
      } else {
        toast.error(res.data.message || "Failed to add goal");
      }
    } catch (err) {
      console.error("GoalPlans: add goal failed", err);
      toast.error("Failed to add goal");
    } finally {
      setAdding(false);
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const atRisk = useMemo(() => {
    const now = new Date();
    return allGoals
      .filter((g) => !g.isCompleted)
      .map((g) => ({ goal: g, plan: getTimePlan(g, now), progress: getGoalProgress(g) }))
      .filter((x) => x.plan.status === "overdue" || x.plan.status === "tight")
      .sort((a, b) => {
        if (a.plan.status !== b.plan.status) {
          return a.plan.status === "overdue" ? -1 : 1;
        }
        return (a.plan.daysLeft ?? 9999) - (b.plan.daysLeft ?? 9999);
      })
      .slice(0, 5);
  }, [allGoals]);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goal Plans</h2>
          <p className="text-muted-foreground">A calendar-driven plan that turns goals into weekly savings actions.</p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a goal</DialogTitle>
              <DialogDescription>Short-term for the next few months, long-term for big life wins.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <select
                  value={newGoal.goalType}
                  onChange={(e) => setNewGoal((p) => ({ ...p, goalType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="shortTerm">Short-term</option>
                  <option value="longTerm">Long-term</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={newGoal.title} onChange={(e) => setNewGoal((p) => ({ ...p, title: e.target.value }))} />
              </div>

              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newGoal.description}
                  onChange={(e) => setNewGoal((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Target (₹)</Label>
                  <Input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal((p) => ({ ...p, targetAmount: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal((p) => ({ ...p, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="savings">Savings</option>
                    <option value="purchase">Purchase</option>
                    <option value="investment">Investment</option>
                    <option value="education">Education</option>
                    <option value="travel">Travel</option>
                    <option value="emergency">Emergency Fund</option>
                    <option value="debt_repayment">Debt Repayment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button onClick={submitNewGoal} disabled={adding}>
                {adding && <Loader2 className="size-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-primary" />
                  {format(cursorDate, "MMMM yyyy")}
                </CardTitle>
                <CardDescription>Deadlines + weekly savings tasks mapped to real dates.</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCursorDate((d) => subMonths(d, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const now = new Date();
                  setCursorDate(now);
                  setSelectedDay(now);
                }}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCursorDate((d) => addMonths(d, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <div className="grid grid-cols-7 text-xs text-muted-foreground">
                {weekDays.map((w) => (
                  <div key={w} className="px-3 py-2 border-b bg-muted/20 font-medium">
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {month.days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDay.get(key) || [];
                  const inMonth = isSameMonth(day, cursorDate);
                  const isSelected = isSameDay(day, selectedDay);

                  const topEvents = dayEvents.slice(0, 2);
                  const remainingCount = Math.max(0, dayEvents.length - topEvents.length);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "min-h-[88px] md:min-h-[110px] p-2 md:p-3 border-b border-r text-left hover:bg-muted/30 transition-colors",
                        !inMonth && "bg-muted/10 text-muted-foreground",
                        isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                        isToday(day) && "relative"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            !inMonth && "text-muted-foreground",
                            isToday(day) && "text-primary"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {isToday(day) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            today
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {topEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              "text-[10px] md:text-[11px] px-2 py-1 rounded-md truncate",
                              ev.kind === "deadline"
                                ? "bg-red-500/10 text-red-600"
                                : ev.kind === "set-deadline"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-green-500/10 text-green-700"
                            )}
                            title={`${ev.title} — ${ev.subtitle}`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {ev.kind === "deadline" ? (
                                <CalendarDays className="w-4 h-4 text-red-600" />
                              ) : ev.kind === "set-deadline" ? (
                                <MapPin className="w-4 h-4 text-amber-700" />
                              ) : (
                                <DollarSign className="w-4 h-4 text-green-700" />
                              )}
                              <span className="align-middle">{ev.subtitle}</span>
                            </span>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="text-[10px] text-muted-foreground">+{remainingCount} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Day plan</CardTitle>
              <CardDescription>{format(selectedDay, "EEE, MMM d")}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goal actions scheduled for this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} className="rounded-lg border p-3 bg-muted/10">
                      <p className="text-sm font-semibold truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</p>
                      <p className="text-[11px] text-muted-foreground mt-2 truncate">
                        {ev.goal?.goalType === "shortTerm" ? "Short-term" : "Long-term"} • {ev.goal?.category || "goal"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">At risk</CardTitle>
              <CardDescription>Goals that need attention soon.</CardDescription>
            </CardHeader>
            <CardContent>
              {atRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground">All good — no urgent goals right now.</p>
              ) : (
                <div className="space-y-3">
                  {atRisk.map(({ goal, plan, progress }) => (
                    <div key={`${goal.goalType}:${goal.id}`} className="rounded-lg border p-3">
                      <p className="text-sm font-semibold truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.status === "overdue" ? "Overdue" : `${plan.daysLeft} days left`} • Need ₹{(plan.perWeek || 0).toLocaleString()}/week
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-sm font-bold text-purple-600 w-10 text-right">{progress}%</span>
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full transition-all" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="short" className="space-y-4">
        <TabsList>
          <TabsTrigger value="short">Short-term goals</TabsTrigger>
          <TabsTrigger value="long">Long-term goals</TabsTrigger>
          <TabsTrigger value="all">All goals</TabsTrigger>
        </TabsList>

        <TabsContent value="short" className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading goals...
            </div>
          ) : goals.short.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No short-term goals yet. Add one above.</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {goals.short.map((g) => (
                <GoalCard key={`short:${g.id}`} goal={g} onUpdateAmount={handleUpdateAmount} onToggleDone={handleToggleDone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="long" className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading goals...
            </div>
          ) : goals.long.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No long-term goals yet. Add one above.</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {goals.long.map((g) => (
                <GoalCard key={`long:${g.id}`} goal={g} onUpdateAmount={handleUpdateAmount} onToggleDone={handleToggleDone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading goals...
            </div>
          ) : allGoals.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No goals yet. Add one above.</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allGoals.map((g) => (
                <GoalCard key={`${g.goalType}:${g.id}`} goal={g} onUpdateAmount={handleUpdateAmount} onToggleDone={handleToggleDone} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Update saved amount dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update saved amount</DialogTitle>
            <DialogDescription>
              Keep this accurate — it drives the weekly plan and calendar tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Saved so far (₹)</Label>
            <Input type="number" value={newSavedAmount} onChange={(e) => setNewSavedAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} disabled={savingUpdate}>
              Cancel
            </Button>
            <Button onClick={submitUpdateAmount} disabled={savingUpdate}>
              {savingUpdate && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
