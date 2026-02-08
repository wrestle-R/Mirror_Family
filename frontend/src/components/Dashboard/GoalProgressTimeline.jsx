
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Flag, CheckCircle2, Circle, Trophy, Navigation, Calendar, Clock } from "lucide-react";
import { calculateGoalTimeline } from "@/utils/goalTimelineUtils";
import { Money } from "@/components/ui/money";

export default function GoalProgressTimeline({
    currentSavings = 0,
    shortTermGoals = [],
    longTermGoals = [],
    monthlyContribution = 0
}) {
    const [hoveredMilestone, setHoveredMilestone] = useState(null);

    const {
        hasGoals,
        totalTarget,
        progress,
        milestones
    } = calculateGoalTimeline(currentSavings, shortTermGoals, longTermGoals, monthlyContribution);

    if (!hasGoals) {
        return null;
    }

    return (
        <Card className="border-l-4 border-l-primary shadow-sm bg-linear-to-r from-card to-muted/10">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-primary" />
                            Goal Journey
                        </CardTitle>
                        <CardDescription>
                            You've saved <strong><Money>₹{currentSavings.toLocaleString()}</Money></strong> of <strong><Money>₹{totalTarget.toLocaleString()}</Money></strong> total target
                        </CardDescription>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-bold text-primary">
                            {Math.round(progress)}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                            Completion
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-8 pt-2">
                {/* Timeline Container */}
                <div className="relative h-24 flex items-center justify-center select-none">

                    {/* Main Rail - Background */}
                    <div className="absolute left-0 right-0 h-3 bg-muted rounded-full overflow-hidden">
                        {/* Tick Marks for grid effect */}
                        {[0, 25, 50, 75, 100].map(tick => (
                            <div
                                key={tick}
                                className="absolute top-0 bottom-0 w-0.5 bg-background/50 z-10"
                                style={{ left: `${tick}%` }}
                            />
                        ))}
                    </div>

                    {/* Active Progress Fill */}
                    <motion.div
                        className="absolute left-0 h-3 bg-linear-to-r from-primary/80 to-primary rounded-full z-10 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Milestones Layer */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {milestones.map((milestone, idx) => (
                            <TimelineMilestone
                                key={milestone.id}
                                milestone={milestone}
                                isLast={idx === milestones.length - 1}
                                setHovered={setHoveredMilestone}
                            />
                        ))}
                    </div>

                    {/* Start Point Label */}
                    <div className="absolute left-0 top-full mt-2 text-xs font-semibold text-muted-foreground">
                        Today
                    </div>

                    {/* End Point Label */}
                    <div className="absolute right-0 top-full mt-2 text-xs font-semibold text-muted-foreground">
                        Total Goal
                    </div>

                </div>

                {/* Dynamic Tooltip/Area for Selected Milestone */}
                <div className="min-h-[3rem] mt-2 flex flex-col items-center justify-center text-center">
                    <AnimatePresence mode="wait">
                        {hoveredMilestone ? (
                            <motion.div
                                key="hover"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="bg-popover text-popover-foreground border px-4 py-2 rounded-lg shadow-sm text-sm"
                            >
                                <div className="flex items-center gap-2 mb-1 justify-center">
                                    <span className="font-semibold text-primary">{hoveredMilestone.title}</span>
                                    <span className="text-muted-foreground mx-1">•</span>
                                    <span>Target: <Money>₹{hoveredMilestone.targetAmount.toLocaleString()}</Money></span>
                                    {hoveredMilestone.isReached && (
                                        <span className="ml-2 inline-flex items-center text-green-600 text-xs font-bold uppercase tracking-wider">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Achieved
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4 justify-center text-xs">
                                    {hoveredMilestone.deadline && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            Deadline: {format(new Date(hoveredMilestone.deadline), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                    {hoveredMilestone.projectedDate && !hoveredMilestone.isReached && (
                                        <div className="flex items-center gap-1 text-blue-600 font-medium">
                                            <Clock className="w-3 h-3" />
                                            Est. Completion: {format(hoveredMilestone.projectedDate, 'MMM yyyy')}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="default"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-muted-foreground italic flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4" />
                                Hover over the dots to see your milestones and timeline projection
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </CardContent>
        </Card>
    );
}

// Sub-component for individual milestones
const TimelineMilestone = ({ milestone, isLast, setHovered }) => {
    const [isHoveredLocal, setIsHoveredLocal] = useState(false);
    const color = milestone.isReached ? "var(--primary)" : "var(--muted-foreground)";
    const bgColor = milestone.isReached ? "var(--background)" : "var(--muted)";
    const iconColor = milestone.isReached ? "text-green-500" : "text-muted-foreground";

    return (
        <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
            style={{ left: `${milestone.position}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + (milestone.position / 100), type: "spring" }}
            onMouseEnter={() => { setHovered(milestone); setIsHoveredLocal(true); }}
            onMouseLeave={() => { setHovered(null); setIsHoveredLocal(false); }}
        >
            {/* Halo Effect on Hover */}
            {isHoveredLocal && (
                <motion.div
                    layoutId="halo"
                    className="absolute -inset-3 bg-primary/20 rounded-full blur-[2px]"
                    transition={{ duration: 0.2 }}
                />
            )}

            {/* The Dot */}
            <div className={`relative w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center transition-colors duration-300 ${milestone.isReached ? "border-green-500" : "border-muted-foreground"
                }`}>
                {/* Inner Dot if active */}
                {milestone.isReached && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
            </div>

            {/* Reached Pulse Effect */}
            {milestone.isReached && !isHoveredLocal && (
                <span className="absolute -inset-1 rounded-full bg-green-500/30 animate-ping" />
            )}

            {/* Label Line (Stem) */}
            <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-3 mb-1 transition-colors ${isHoveredLocal ? 'bg-primary' : (milestone.isReached ? 'bg-green-500/50' : 'bg-muted-foreground/30')
                    }`}
            />
        </motion.div>
    );
};
