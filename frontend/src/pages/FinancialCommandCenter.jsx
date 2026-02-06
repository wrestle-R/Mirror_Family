
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useFinancialSimulation } from "@/utils/simulationUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Activity, RotateCcw, TrendingUp, TrendingDown, PiggyBank, ShieldAlert, Sliders } from "lucide-react";
import GoalProgressTimeline from "@/components/Dashboard/GoalProgressTimeline";
import FinancialHealthScoreCard from "@/components/Dashboard/FinancialHealthScoreCard";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- CONTROL PANEL COMPONENT --- (Realigned to site-wide spacing/typography)
const ControlPanel = ({ title, icon: Icon, controls, align = "left" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 bg-card border rounded-xl p-6 h-full shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            </div>

            <div className="space-y-8">
                {controls.map((control) => (
                    <div key={control.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{control.label}</Label>
                                {control.hint && (
                                    <p className="text-[10px] text-muted-foreground">{control.hint}</p>
                                )}
                            </div>
                            <span className={`text-lg font-bold font-mono tracking-tight ${control.highlight ? 'text-primary' : ''}`}>
                                {control.format ? control.format(control.value || 0) : (control.value || 0)}
                            </span>
                        </div>
                        <Slider
                            value={[control.value]}
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            onValueChange={(val) => control.onChange(val[0])}
                            className={`py-2 active:cursor-grabbing ${control.highlight ? 'opacity-100' : 'opacity-90'}`}
                        />
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function FinancialCommandCenter() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    // Simulation Hook
    const {
        simulatedProfile,
        updateSimulation,
        resetSimulation,
        changedFields,
        healthScore,
        timelineData
    } = useFinancialSimulation(profileData || {});

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.uid) return;
            try {
                const res = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
                if (res.data.success) {
                    const profile = res.data.data.profile;
                    // Calculate total calculated expenses once for the 'totalExpenses' simulator
                    const totalExp = (profile.rentExpense || 0) + (profile.foodExpense || 0) +
                        (profile.transportationExpense || 0) + (profile.utilitiesExpense || 0) +
                        (profile.otherExpenses || 0);

                    setProfileData({ ...profile, totalExpenses: totalExp });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleExpenseChange = (totalVal) => {
        const fixed = (simulatedProfile.rentExpense || 0) +
            (simulatedProfile.foodExpense || 0) +
            (simulatedProfile.transportationExpense || 0) +
            (simulatedProfile.utilitiesExpense || 0);
        const newOther = Math.max(0, totalVal - fixed);
        updateSimulation('otherExpenses', newOther);
    };

    const currentTotalExpenses = (simulatedProfile.rentExpense || 0) +
        (simulatedProfile.foodExpense || 0) +
        (simulatedProfile.transportationExpense || 0) +
        (simulatedProfile.utilitiesExpense || 0) +
        (simulatedProfile.otherExpenses || 0);

    if (loading) return <div className="flex h-screen items-center justify-center p-8 text-muted-foreground animate-pulse font-medium">Loading Simulator...</div>;
    if (!profileData) return <div className="p-8 text-center text-destructive underline">Unable to load profile data. Please check your connection.</div>;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 min-h-screen">
            {/* Header Section (Synced with Dashboard) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary" />
                        Command Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Dynamic simulation layer. Tweak your numbers to see the impact.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {Object.keys(changedFields).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider mr-2 bg-amber-500/10 px-2.5 py-1 rounded">
                                    Simulation Active
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={resetSimulation}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-all text-sm font-medium border"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset Scenarios
                    </button>
                </div>
            </motion.div>

            {/* Vertical Stack Layout (Synced Spacing: space-y-6) */}
            <div className="flex flex-col gap-6">

                {/* 1. Prime Focus: The Premium Health Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <FinancialHealthScoreCard profileData={simulatedProfile} />
                </motion.div>

                {/* 2. Visual Outcome: Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full"
                >
                    <GoalProgressTimeline
                        currentSavings={simulatedProfile.currentSavings}
                        shortTermGoals={simulatedProfile.shortTermGoals}
                        longTermGoals={simulatedProfile.longTermGoals}
                    />
                </motion.div>

                {/* 3. The Control Bay: Split row of controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Money Flow (Income/Expenses) */}
                    <ControlPanel
                        title="Money Flow"
                        icon={TrendingUp}
                        align="left"
                        controls={[
                            {
                                id: 'income',
                                label: 'Monthly Income',
                                value: simulatedProfile.monthlyIncome,
                                min: 0,
                                max: Math.max((profileData.monthlyIncome || 10000) * 3, 100000),
                                step: 500,
                                onChange: (val) => updateSimulation('monthlyIncome', val),
                                format: (v) => `₹${(v || 0).toLocaleString()}`,
                                highlight: changedFields['monthlyIncome'],
                                hint: "Higher income directly boosts your cash flow score."
                            },
                            {
                                id: 'expenses',
                                label: 'Total Expenses',
                                value: currentTotalExpenses,
                                min: 0,
                                max: Math.max(currentTotalExpenses * 2 + 10000, 50000),
                                step: 500,
                                onChange: handleExpenseChange,
                                format: (v) => `₹${(v || 0).toLocaleString()}`,
                                highlight: changedFields['otherExpenses'],
                                hint: "Lowering expenses is the fastest way to improved health."
                            }
                        ]}
                    />

                    {/* Right: Assets & Debt (Savings/Debt) */}
                    <ControlPanel
                        title="Assets & Debt"
                        icon={PiggyBank}
                        align="right"
                        controls={[
                            {
                                id: 'savings',
                                label: 'Current Savings',
                                value: simulatedProfile.currentSavings,
                                min: 0,
                                max: Math.max((profileData.currentSavings || 50000) * 4 + 100000, 200000),
                                step: 1000,
                                onChange: (val) => updateSimulation('currentSavings', val),
                                format: (v) => `₹${(v || 0).toLocaleString()}`,
                                highlight: changedFields['currentSavings'],
                                hint: "Directly accelerates your goal completion timeline."
                            },
                            {
                                id: 'debt',
                                label: 'Monthly Debt Pay',
                                value: simulatedProfile.debtPaymentMonthly,
                                min: 0,
                                max: Math.max(simulatedProfile.debtPaymentMonthly * 3, 50000),
                                step: 500,
                                onChange: (val) => updateSimulation('debtPaymentMonthly', val),
                                format: (v) => `₹${(v || 0).toLocaleString()}`,
                                highlight: changedFields['debtPaymentMonthly'],
                                hint: "Reducing debt payments lowers your financial pressure."
                            }
                        ]}
                    />
                </div>

                {/* 4. Insight Summary (Synced Styling) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl border bg-primary/5 border-primary/20 flex flex-col md:flex-row items-start md:items-center gap-4"
                >
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                        <ShieldAlert className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-lg">Impact Analysis</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {healthScore.totalScore < 50
                                ? "Critical: This scenario indicates a stressed financial position. Focus on widening your net balance."
                                : healthScore.totalScore < 80
                                    ? "Stable: This scenario is sustainable and shows healthy progress toward your milestones."
                                    : "Excellent: You have reached an elite financial state in this scenario. Capital allocation is optimal."
                            }
                        </p>
                    </div>
                </motion.div>

                {/* Visual spacer */}
                <div className="h-10" />
            </div>
        </div>
    );
}
