
import { addMonths } from "date-fns";

/**
 * Utility to calculate goal timeline metrics.
 * Aggregates all goals into a single cumulative timeline.
 * 
 * Logic:
 * 1. Sort goals by target amount (smallest "wins" first).
 * 2. Map them onto a cumulative 0-100% timeline.
 * 3. Compare current savings against this cumulative path.
 * 4. Calculate projected achievement dates based on monthly contribution.
 */

export const calculateGoalTimeline = (currentSavings = 0, shortTermGoals = [], longTermGoals = [], monthlyContribution = 0) => {
    // 1. Combine and Filter
    const allGoals = [...shortTermGoals, ...longTermGoals]
        .filter(g => g.targetAmount > 0)
        .map(g => ({
            ...g,
            type: shortTermGoals.includes(g) ? 'Short-term' : 'Long-term'
        }))
        .sort((a, b) => a.targetAmount - b.targetAmount);

    // 2. Handle Empty State
    if (allGoals.length === 0) {
        return {
            hasGoals: false,
            totalTarget: 0,
            currentSavings,
            progress: 0,
            milestones: []
        };
    }

    // 3. Calculate Cumulative Targets
    const totalTarget = allGoals.reduce((sum, g) => sum + g.targetAmount, 0);

    // Cap progress at 100% for the visual rail, but keep raw for text if needed
    const rawProgress = (currentSavings / totalTarget) * 100;
    const progress = Math.min(100, Math.max(0, rawProgress));

    let runningTotal = 0;
    const now = new Date();

    const milestones = allGoals.map(goal => {
        runningTotal += goal.targetAmount;

        // Position on the timeline (0-100%)
        const position = (runningTotal / totalTarget) * 100;

        // Has this specific goal 'milestone' been passed by current savings?
        // Using cumulative logic: You satisfy the smallest goals first.
        const isReached = currentSavings >= runningTotal;

        // Calculate projection
        let projectedDate = null;
        if (!isReached && monthlyContribution > 0) {
            const remaining = runningTotal - currentSavings;
            const monthsNeeded = Math.ceil(remaining / monthlyContribution);
            projectedDate = addMonths(now, monthsNeeded);
        }

        return {
            id: goal.id || goal._id || Math.random(),
            title: goal.title,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount, // Individual goal progress if tracked separately
            cumulativeTarget: runningTotal,
            position,
            isReached,
            type: goal.type,
            deadline: goal.deadline,
            projectedDate
        };
    });

    return {
        hasGoals: true,
        totalTarget,
        currentSavings,
        progress,
        milestones
    };
};
