
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { calculateFinancialHealth } from "@/utils/healthScoreUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    RotateCcw,
    TrendingUp,
    PiggyBank,
    Sparkles,
    Wallet,
    CreditCard,
    Banknote,
    FlaskConical,
    AlertCircle,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import GoalProgressTimeline from "@/components/Dashboard/GoalProgressTimeline";
import FinancialHealthScoreCard from "@/components/Dashboard/FinancialHealthScoreCard";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const DiffIndicator = ({ original, current, format }) => {
    if (original === current || original === undefined || current === undefined) return null;
    const diff = current - original;
    if (diff === 0) return null;

    return (
        <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xs font-mono font-semibold ml-2 px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${diff > 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
                }`}
        >
            {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {format ? format(Math.abs(diff)) : Math.abs(diff).toLocaleString()}
        </motion.span>
    );
};

// Dynamic scenario sentence generator
const ScenarioNarrative = ({ changes, originalProfile, simulatedProfile }) => {
    const narrative = useMemo(() => {
        const parts = [];

        if (changes.monthlyIncome) {
            const diff = (simulatedProfile.monthlyIncome || 0) - (originalProfile.monthlyIncome || 0);
            if (diff > 0) parts.push(`my income increases by ₹${Math.abs(diff).toLocaleString()}`);
            else if (diff < 0) parts.push(`my income drops by ₹${Math.abs(diff).toLocaleString()}`);
        }

        if (changes.totalExpenses) {
            const diff = (simulatedProfile.totalExpenses || 0) - (originalProfile.totalExpenses || 0);
            if (diff > 0) parts.push(`I spend ₹${Math.abs(diff).toLocaleString()} more`);
            else if (diff < 0) parts.push(`I reduce expenses by ₹${Math.abs(diff).toLocaleString()}`);
        }

        if (changes.currentSavings) {
            const diff = (simulatedProfile.currentSavings || 0) - (originalProfile.currentSavings || 0);
            if (diff > 0) parts.push(`I save ₹${Math.abs(diff).toLocaleString()} more`);
            else if (diff < 0) parts.push(`I withdraw ₹${Math.abs(diff).toLocaleString()} from savings`);
        }

        if (changes.debtPaymentMonthly) {
            const diff = (simulatedProfile.debtPaymentMonthly || 0) - (originalProfile.debtPaymentMonthly || 0);
            if (diff > 0) parts.push(`I pay ₹${Math.abs(diff).toLocaleString()} more towards debt`);
            else if (diff < 0) parts.push(`I reduce debt payments by ₹${Math.abs(diff).toLocaleString()}`);
        }

        if (parts.length === 0) return null;

        return `What if ${parts.join(" and ")}?`;
    }, [changes, originalProfile, simulatedProfile]);

    if (!narrative) {
        return (
            <div className="text-muted-foreground text-sm">
                👆 Adjust the sliders below to simulate different financial scenarios.
            </div>
        );
    }

    return (
        <motion.div
            key={narrative}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base md:text-lg font-medium text-foreground"
        >
            {narrative}
        </motion.div>
    );
};

// AI Analysis component with dynamic messaging
const ScenarioAIAnalysis = ({ currentScore, originalScore, isActive }) => {
    if (!isActive) {
        return (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30 border-border">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-muted-foreground">AI Scenario Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                        Adjust variables to see real-time impact on your financial stability.
                    </p>
                </div>
            </div>
        );
    }

    const diff = currentScore - originalScore;
    const isImprovement = diff > 0;
    const isDecline = diff < 0;
    const isStable = currentScore >= 75;

    let message = "";
    let badgeText = "";
    let badgeClass = "";

    if (isImprovement) {
        if (isStable && originalScore < 75) {
            message = "🌟 Breakthrough! You've reached Financial Stability. This strategy is highly effective.";
            badgeText = "Stability Achieved";
            badgeClass = "bg-indigo-500/10 text-indigo-600";
        } else if (diff > 15) {
            message = "🚀 Major Surge! Your financial health is skyrocketing with these changes.";
            badgeText = "Strong Growth";
            badgeClass = "bg-emerald-500/10 text-emerald-600";
        } else {
            message = "✅ Positive Impact. You're moving comfortably towards your goals.";
            badgeText = "Improvement";
            badgeClass = "bg-teal-500/10 text-teal-600";
        }
    } else if (isDecline) {
        if (diff < -15) {
            message = "⚠️ Critical Risk. This change drastically undermines your security. Reconsider.";
            badgeText = "High Danger";
            badgeClass = "bg-rose-500/10 text-rose-600";
        } else {
            message = "📉 Downward Trend. This adjustment weakens your financial resilience slightly.";
            badgeText = "Caution";
            badgeClass = "bg-amber-500/10 text-amber-600";
        }
    } else {
        message = "➡️ Steady State. This change maintains your current equilibrium.";
        badgeText = "Neutral";
        badgeClass = "bg-blue-500/10 text-blue-600";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentScore} // Animate on score change
            className="flex items-start gap-3 p-4 rounded-xl border bg-primary/5 border-primary/20 h-full"
        >
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold">AI Insights</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeClass}`}>
                        {badgeText}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                </p>
                <div className="flex items-center gap-4 pt-2 text-xs border-t border-primary/10 mt-2">
                    <span className="text-muted-foreground">Net Effect:</span>
                    <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                        {diff > 0 ? '+' : ''}{diff} Points
                    </span>
                    <span className="text-muted-foreground mx-1">•</span>
                    <span className="text-muted-foreground">New Score: {currentScore}/100</span>
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// SECTION 1: REAL FINANCIAL SNAPSHOT
// ============================================================================

const FinancialSummaryGrid = ({ profile }) => {
    const totalExpenses = (profile.rentExpense || 0) + (profile.foodExpense || 0) +
        (profile.transportationExpense || 0) + (profile.utilitiesExpense || 0) + (profile.otherExpenses || 0);

    const items = [
        { label: "Monthly Income", value: profile.monthlyIncome || 0, icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Total Expenses", value: totalExpenses, icon: Banknote, color: "text-red-500", bg: "bg-red-500/10" },
        { label: "Current Savings", value: profile.currentSavings || 0, icon: PiggyBank, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Monthly Debt", value: profile.debtPaymentMonthly || 0, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item, idx) => (
                <Card key={idx} className="border bg-card/50">
                    <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className={`p-2 rounded-full ${item.bg} ${item.color} shrink-0`}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium truncate">{item.label}</p>
                            <p className="text-base md:text-lg font-bold truncate">₹{item.value.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const RealSnapshotSection = ({ profile }) => {
    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        Your Current Financial Snapshot
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">Real data from your profile. Unaffected by simulation.</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-fit">
                    Real Data
                </Badge>
            </div>

            <div className="space-y-6">
                <FinancialHealthScoreCard profileData={profile} />
                <FinancialSummaryGrid profile={profile} />
                <GoalProgressTimeline
                    currentSavings={profile.currentSavings}
                    shortTermGoals={profile.shortTermGoals}
                    longTermGoals={profile.longTermGoals}
                />
            </div>
        </section>
    );
};

// ============================================================================
// SECTION 2: SIMULATION LAB
// ============================================================================

const SimulationSlider = ({
    label,
    hint,
    value,
    originalValue,
    min,
    max,
    step,
    onChange,
    format,
    icon: Icon
}) => {
    const hasChanged = value !== originalValue;
    const displayValue = format ? format(value) : value.toLocaleString();

    return (
        <div className="space-y-3 group p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className={`w-4 h-4 ${hasChanged ? 'text-primary' : 'text-muted-foreground'}`} />}
                    <div>
                        <Label className={`text-xs md:text-sm font-semibold transition-colors ${hasChanged ? "text-foreground" : "text-muted-foreground"
                            }`}>
                            {label}
                        </Label>
                        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-base md:text-lg font-bold font-mono transition-colors ${hasChanged ? 'text-primary' : ''
                        }`}>
                        {displayValue}
                    </span>
                    <DiffIndicator original={originalValue} current={value} format={format} />
                </div>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(val) => onChange(val[0])}
                className="py-2 cursor-grab active:cursor-grabbing"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>{format ? format(min) : `₹${min.toLocaleString()}`}</span>
                <span>{format ? format(max) : `₹${max.toLocaleString()}`}</span>
            </div>
        </div>
    );
};

const SimulationLabSection = ({ originalProfile }) => {
    // Calculate original total expenses
    const originalTotalExp = useMemo(() =>
        (originalProfile.rentExpense || 0) + (originalProfile.foodExpense || 0) +
        (originalProfile.transportationExpense || 0) + (originalProfile.utilitiesExpense || 0) +
        (originalProfile.otherExpenses || 0),
        [originalProfile]);

    // Create normalized original profile with totalExpenses field
    const normalizedOriginal = useMemo(() => ({
        ...originalProfile,
        totalExpenses: originalTotalExp
    }), [originalProfile, originalTotalExp]);

    // Local simulation state - completely isolated
    // We now track totalExpenses directly instead of modifying otherExpenses
    const [simState, setSimState] = useState(() => ({
        ...normalizedOriginal
    }));
    const [changedFields, setChangedFields] = useState({});

    // Health scores
    const originalScore = useMemo(() => calculateFinancialHealth(normalizedOriginal).totalScore, [normalizedOriginal]);

    // Create a profile for health calculation that uses simulated totalExpenses
    const simProfileForCalc = useMemo(() => {
        // Distribute expenses proportionally if totalExpenses changed
        const ratio = simState.totalExpenses > 0 && originalTotalExp > 0
            ? simState.totalExpenses / originalTotalExp
            : 1;

        return {
            ...simState,
            rentExpense: (originalProfile.rentExpense || 0) * ratio,
            foodExpense: (originalProfile.foodExpense || 0) * ratio,
            transportationExpense: (originalProfile.transportationExpense || 0) * ratio,
            utilitiesExpense: (originalProfile.utilitiesExpense || 0) * ratio,
            otherExpenses: (originalProfile.otherExpenses || 0) * ratio,
        };
    }, [simState, originalProfile, originalTotalExp]);

    const currentHealthData = useMemo(() => calculateFinancialHealth(simProfileForCalc), [simProfileForCalc]);
    const currentScore = currentHealthData.totalScore;

    // Update handler
    const updateSimulation = useCallback((field, value) => {
        setSimState(prev => ({ ...prev, [field]: Number(value) }));
        setChangedFields(prev => ({ ...prev, [field]: true }));
    }, []);

    // Reset handler
    const resetSimulation = useCallback(() => {
        setSimState({ ...normalizedOriginal });
        setChangedFields({});
    }, [normalizedOriginal]);

    const isSimulationActive = Object.keys(changedFields).length > 0;
    const formatCurrency = (v) => `₹${(v || 0).toLocaleString()}`;

    // Slider configurations with proper ranges - ALL start from 0
    const incomeMax = Math.max((originalProfile.monthlyIncome || 0) * 5, 500000);
    const expenseMax = Math.max(originalTotalExp * 3, 300000);
    const savingsMax = Math.max((originalProfile.currentSavings || 0) * 5, 1000000);
    const debtMax = Math.max((originalProfile.debtPaymentMonthly || 0) * 5, 100000);

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-primary">
                        <FlaskConical className="w-5 h-5" />
                        What Happens If... (Simulation)
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                            Changes here do not affect your actual data.
                        </p>
                    </div>
                </div>
                <AnimatePresence>
                    {isSimulationActive && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={resetSimulation}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all text-sm font-medium shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset All
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Dynamic Narrative */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-dashed border-primary/20">
                <ScenarioNarrative
                    changes={changedFields}
                    originalProfile={normalizedOriginal}
                    simulatedProfile={simState}
                />
            </div>

            {/* Main Layout - Stacked */}
            <div className="space-y-8">
                {/* Section A: Sliders */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Adjust Variables
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SimulationSlider
                            label="Monthly Income"
                            hint="Your total earnings"
                            icon={Wallet}
                            value={simState.monthlyIncome || 0}
                            originalValue={normalizedOriginal.monthlyIncome || 0}
                            min={0}
                            max={incomeMax}
                            step={1000}
                            onChange={(val) => updateSimulation('monthlyIncome', val)}
                            format={formatCurrency}
                        />

                        <SimulationSlider
                            label="Total Expenses"
                            hint="All monthly costs"
                            icon={Banknote}
                            value={simState.totalExpenses || 0}
                            originalValue={originalTotalExp}
                            min={0}
                            max={expenseMax}
                            step={500}
                            onChange={(val) => updateSimulation('totalExpenses', val)}
                            format={formatCurrency}
                        />

                        <SimulationSlider
                            label="Current Savings"
                            hint="Your liquid savings"
                            icon={PiggyBank}
                            value={simState.currentSavings || 0}
                            originalValue={normalizedOriginal.currentSavings || 0}
                            min={0}
                            max={savingsMax}
                            step={5000}
                            onChange={(val) => updateSimulation('currentSavings', val)}
                            format={formatCurrency}
                        />

                        <SimulationSlider
                            label="Debt Payments"
                            hint="Monthly debt service"
                            icon={CreditCard}
                            value={simState.debtPaymentMonthly || 0}
                            originalValue={normalizedOriginal.debtPaymentMonthly || 0}
                            min={0}
                            max={debtMax}
                            step={500}
                            onChange={(val) => updateSimulation('debtPaymentMonthly', val)}
                            format={formatCurrency}
                        />
                    </div>
                </div>

                {/* Section B: Projected Impact */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Projected Impact
                    </h3>

                    <motion.div
                        className={`transition-all duration-300 ${isSimulationActive ? '' : 'opacity-60'}`}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Simulated Health Score */}
                            <div className={`transition-all duration-300 rounded-2xl ${isSimulationActive ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''
                                }`}>
                                <FinancialHealthScoreCard profileData={simProfileForCalc} isCompact={true} />
                            </div>

                            {/* AI Analysis */}
                            <div className="h-full">
                                <ScenarioAIAnalysis
                                    currentScore={currentScore}
                                    originalScore={originalScore}
                                    isActive={isSimulationActive}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Timeline Section - Full Width Below */}
            {isSimulationActive && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl p-1 bg-card shadow-sm"
                >
                    <GoalProgressTimeline
                        currentSavings={simState.currentSavings}
                        shortTermGoals={simState.shortTermGoals}
                        longTermGoals={simState.longTermGoals}
                    />
                </motion.div>
            )}
        </section>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function FinancialCommandCenter() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [originalProfile, setOriginalProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.uid) return;
            try {
                const res = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
                if (res.data.success) {
                    setOriginalProfile(res.data.data.profile);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center p-8">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground font-medium">Loading Command Center...</p>
                </div>
            </div>
        );
    }

    if (!originalProfile) {
        return (
            <div className="flex h-screen items-center justify-center p-8">
                <div className="text-center space-y-3 max-w-md">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                    <h2 className="text-xl font-semibold">Unable to Load Profile</h2>
                    <p className="text-muted-foreground">Please check your connection and try refreshing the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-6 lg:p-8 pb-32 min-h-screen max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
                    Financial Command Center
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Analyze your financial health and simulate different scenarios.
                </p>
            </div>

            {/* Section 1: Real Snapshot */}
            <RealSnapshotSection profile={originalProfile} />

            <Separator className="my-6 md:my-8" />

            {/* Section 2: Simulation Lab */}
            <SimulationLabSection originalProfile={originalProfile} />
        </div>
    );
}
