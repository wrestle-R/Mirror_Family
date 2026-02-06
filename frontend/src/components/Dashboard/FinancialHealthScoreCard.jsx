
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Wallet, PiggyBank, Target, Activity, Info, ShieldCheck } from "lucide-react";
import { calculateFinancialHealth } from "@/utils/healthScoreUtils";

// Color interpolation for the main score
const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"; // Emerald 500
    if (score >= 60) return "#8b5cf6"; // Violet 500 - slightly more premium than just green
    if (score >= 40) return "#f59e0b"; // Amber 500
    return "#ef4444"; // Red 500
};

const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1500; // ms
        const steps = 60;
        const stepTime = duration / steps;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return <span className="tabular-nums">{displayValue}</span>;
};

const BreakdownArc = ({ index, score, color, label, isActive, totalArcs = 4 }) => {
    // Each arc takes up (360 / totalArcs) portion of the circle
    // We want a small gap between them
    const gap = 4; // degrees
    const sectionAngle = 360 / totalArcs;
    const availableAngle = sectionAngle - gap;

    // The length of the arc depends on the score (0-100)
    // 100 score = fill entire available angle
    const fillAngle = (Math.max(5, score) / 100) * availableAngle; // Min 5% so it's visible

    const radius = 80;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;

    // Calculate dash array
    // (filled length) (gap length)
    const arcLength = (fillAngle / 360) * circumference;
    const totalSectionLength = (availableAngle / 360) * circumference;

    // Rotation to position the arc correctly
    // Start from top (-90deg), then offset by index
    const rotation = -90 + (index * sectionAngle) + (gap / 2);

    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="cursor-pointer"
        >
            {/* Background Track for this segment */}
            <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${totalSectionLength} ${circumference - totalSectionLength}`}
                strokeLinecap="round"
                transform={`rotate(${rotation} 100 100)`}
                className="opacity-20"
            />

            {/* Active Score Arc */}
            <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeLinecap="round"
                transform={`rotate(${rotation} 100 100)`}
                initial={{ strokeDashoffset: arcLength }} // Animate draw
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
        </motion.g>
    );
};

export default function FinancialHealthScoreCard({ profileData }) {
    const [isHovered, setIsHovered] = useState(false);
    const healthData = calculateFinancialHealth(profileData);
    const { totalScore, breakdown } = healthData;
    const scoreColor = getScoreColor(totalScore);

    // Icons mapping
    const icons = {
        cashflow: TrendingUp,
        savings: PiggyBank,
        debt: ShieldCheck,
        goals: Target
    };

    return (
        <Card
            className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card/50 to-muted/20 relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Financial Health Score
                        </CardTitle>
                        <CardDescription>
                            Based on your cash flow, savings, debt, and goals.
                        </CardDescription>
                    </div>
                    <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground shadow-sm">
                        Deterministic AI Analysis
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Left: The Ring Visualization */}
                    <div className="relative w-64 h-64 flex-shrink-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full transform transition-transform duration-500 group-hover:scale-105">

                            {/* Default View: Single Score Ring */}
                            <AnimatePresence>
                                {!isHovered && (
                                    <motion.g
                                        key="main-ring"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Track */}
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke="var(--muted)"
                                            strokeWidth="12"
                                            className="opacity-30"
                                        />
                                        {/* Score Path */}
                                        <motion.circle
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke={scoreColor}
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 80}`}
                                            strokeDashoffset={2 * Math.PI * 80 * (1 - totalScore / 100)}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - totalScore / 100) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            transform="rotate(-90 100 100)"
                                        />
                                    </motion.g>
                                )}
                            </AnimatePresence>

                            {/* Hover View: Broken Down Arcs */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.g
                                        key="breakdown-rings"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {breakdown.map((item, index) => (
                                            <BreakdownArc
                                                key={item.id}
                                                index={index}
                                                score={item.score}
                                                color={item.color}
                                                isActive={true}
                                            />
                                        ))}
                                    </motion.g>
                                )}
                            </AnimatePresence>

                            {/* Center Text */}
                            <foreignObject x="40" y="40" width="120" height="120">
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <motion.div
                                        className="text-5xl font-bold tracking-tighter"
                                        style={{ color: isHovered ? 'var(--foreground)' : scoreColor }}
                                        layoutId="score-value"
                                    >
                                        <AnimatedNumber value={totalScore} />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-medium text-muted-foreground mt-1"
                                    >
                                        {isHovered ? "Breakdown" : "Excellent"}
                                        {/* Logic for Label needs to match score */}
                                    </motion.div>
                                </div>
                            </foreignObject>
                        </svg>
                    </div>

                    {/* Right: The Breakdown Grid */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {breakdown.map((item, index) => {
                            const Icon = icons[item.id] || Activity;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (index * 0.1) }}
                                    className={`p-4 rounded-xl border transition-all duration-300 ${isHovered
                                        ? "bg-muted/50 border-primary/20 scale-102 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-muted/30"
                                        }`}
                                    onMouseEnter={() => setIsHovered(true)} // Keep alive when hovering items
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="p-1.5 rounded-md text-white"
                                                style={{ backgroundColor: item.color }}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <span className="font-semibold text-sm">{item.label}</span>
                                        </div>
                                        <span
                                            className="text-lg font-bold"
                                            style={{ color: item.color }}
                                        >
                                            {item.score}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: item.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.score}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-xs font-medium">{item.status}</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={item.description}>
                                                {item.description}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
