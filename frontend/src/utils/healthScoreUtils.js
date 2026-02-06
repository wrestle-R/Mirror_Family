/**
 * Financial Health Score Calculator
 * 
 * Produces a score from 0-100 based on:
 * 1. Cash Flow Health (30%): Income vs Expenses ratio
 * 2. Savings Buffer (30%): Emergency fund coverage
 * 3. Debt Pressure (20%): Debt-to-Income ratio
 * 4. Goal Progress (20%): Active & completed goals
 * 
 * The score is realistic but achievable - users with good habits can score 90+
 */

export const calculateFinancialHealth = (profile) => {
    if (!profile) return { totalScore: 0, breakdown: [] };

    const {
        monthlyIncome = 0,
        currentSavings = 0,
        savingsGoal = 0,
        totalDebt = 0,
        debtPaymentMonthly = 0,
        shortTermGoals = [],
        longTermGoals = [],
        rentExpense = 0,
        foodExpense = 0,
        transportationExpense = 0,
        utilitiesExpense = 0,
        otherExpenses = 0,
    } = profile;

    const totalExpenses = rentExpense + foodExpense + transportationExpense + utilitiesExpense + otherExpenses;

    // =========================================================================
    // 1. CASH FLOW HEALTH (30%)
    // =========================================================================
    // Expense Ratio | Score Range
    // --------------|------------
    // 0-40%         | 85-100 (Excellent)
    // 40-60%        | 65-85  (Strong)
    // 60-80%        | 45-65  (Good)
    // 80-95%        | 20-45  (Fair)
    // 95-100%       | 5-20   (Poor)
    // >100%         | 0-5    (Critical)

    let cashFlowScore = 50; // Default
    let cashFlowLabel = "Unknown";
    let cashFlowMessage = "Add data for analysis";

    if (monthlyIncome > 0) {
        const expenseRatio = totalExpenses / monthlyIncome;

        if (expenseRatio <= 0.4) {
            // Exceptional saver
            cashFlowScore = 85 + ((0.4 - expenseRatio) / 0.4) * 15;
            cashFlowLabel = "Excellent";
            cashFlowMessage = `${Math.round((1 - expenseRatio) * 100)}% surplus`;
        } else if (expenseRatio <= 0.6) {
            // Very good
            cashFlowScore = 65 + ((0.6 - expenseRatio) / 0.2) * 20;
            cashFlowLabel = "Strong";
            cashFlowMessage = `${Math.round((1 - expenseRatio) * 100)}% surplus`;
        } else if (expenseRatio <= 0.8) {
            // Average/Good
            cashFlowScore = 45 + ((0.8 - expenseRatio) / 0.2) * 20;
            cashFlowLabel = "Good";
            cashFlowMessage = `${Math.round((1 - expenseRatio) * 100)}% surplus`;
        } else if (expenseRatio <= 0.95) {
            // Tight
            cashFlowScore = 20 + ((0.95 - expenseRatio) / 0.15) * 25;
            cashFlowLabel = "Fair";
            cashFlowMessage = "Budget is tight";
        } else if (expenseRatio <= 1.0) {
            // Very tight
            cashFlowScore = 5 + ((1.0 - expenseRatio) / 0.05) * 15;
            cashFlowLabel = "Poor";
            cashFlowMessage = "Almost breaking even";
        } else {
            // Overspending
            cashFlowScore = Math.max(0, 5 - ((expenseRatio - 1.0) * 50));
            cashFlowLabel = "Critical";
            cashFlowMessage = "Spending exceeds income";
        }
    } else if (totalExpenses === 0) {
        cashFlowScore = 50;
        cashFlowLabel = "Unknown";
        cashFlowMessage = "Add income data";
    }

    // =========================================================================
    // 2. SAVINGS BUFFER (30%)
    // =========================================================================
    // Months Covered | Score
    // ---------------|-------
    // 12+ months     | 95-100
    // 6-12 months    | 75-95
    // 3-6 months     | 50-75
    // 1-3 months     | 25-50
    // <1 month       | 0-25

    let savingsScore = 0;
    let savingsLabel = "None";
    let savingsMessage = "Start saving today";

    // Use expenses as baseline, fallback to income estimate
    const monthlyBurn = totalExpenses > 0 ? totalExpenses : (monthlyIncome > 0 ? monthlyIncome * 0.6 : 20000);
    const monthsCovered = monthlyBurn > 0 ? currentSavings / monthlyBurn : 0;

    if (currentSavings > 0) {
        if (monthsCovered >= 12) {
            savingsScore = 95 + Math.min(5, (monthsCovered - 12) / 24 * 5);
            savingsLabel = "Excellent";
            savingsMessage = "12+ months runway";
        } else if (monthsCovered >= 6) {
            savingsScore = 75 + ((monthsCovered - 6) / 6) * 20;
            savingsLabel = "Strong";
            savingsMessage = `${monthsCovered.toFixed(1)} months runway`;
        } else if (monthsCovered >= 3) {
            savingsScore = 50 + ((monthsCovered - 3) / 3) * 25;
            savingsLabel = "Good";
            savingsMessage = `${monthsCovered.toFixed(1)} months runway`;
        } else if (monthsCovered >= 1) {
            savingsScore = 25 + ((monthsCovered - 1) / 2) * 25;
            savingsLabel = "Fair";
            savingsMessage = `${monthsCovered.toFixed(1)} months runway`;
        } else {
            savingsScore = monthsCovered * 25;
            savingsLabel = "Low";
            savingsMessage = "Less than 1 month";
        }
    }

    // Bonus if savings goal is set and being achieved
    if (savingsGoal > 0 && currentSavings > 0) {
        const goalProgress = currentSavings / savingsGoal;
        if (goalProgress >= 1) {
            savingsScore = Math.min(100, savingsScore + 10);
            savingsMessage = "Goal achieved! 🎉";
        }
    }

    // =========================================================================
    // 3. DEBT PRESSURE (20%)
    // =========================================================================
    // DTI Ratio | Score
    // ----------|-------
    // 0%        | 100
    // 0-10%     | 85-100
    // 10-20%    | 65-85
    // 20-35%    | 40-65
    // 35-50%    | 15-40
    // >50%      | 0-15

    let debtScore = 100;
    let debtLabel = "Free";
    let debtMessage = "No debt payments";

    const hasDebt = totalDebt > 0 || debtPaymentMonthly > 0;

    if (hasDebt && monthlyIncome > 0) {
        const dti = debtPaymentMonthly / monthlyIncome;

        if (dti <= 0.1) {
            debtScore = 85 + ((0.1 - dti) / 0.1) * 15;
            debtLabel = "Minimal";
            debtMessage = `${Math.round(dti * 100)}% DTI`;
        } else if (dti <= 0.2) {
            debtScore = 65 + ((0.2 - dti) / 0.1) * 20;
            debtLabel = "Low";
            debtMessage = `${Math.round(dti * 100)}% DTI`;
        } else if (dti <= 0.35) {
            debtScore = 40 + ((0.35 - dti) / 0.15) * 25;
            debtLabel = "Moderate";
            debtMessage = `${Math.round(dti * 100)}% DTI - manageable`;
        } else if (dti <= 0.5) {
            debtScore = 15 + ((0.5 - dti) / 0.15) * 25;
            debtLabel = "High";
            debtMessage = `${Math.round(dti * 100)}% DTI - heavy`;
        } else {
            debtScore = Math.max(0, 15 - ((dti - 0.5) * 30));
            debtLabel = "Critical";
            debtMessage = `${Math.round(dti * 100)}% DTI - danger`;
        }
    } else if (hasDebt && monthlyIncome === 0) {
        debtScore = 10;
        debtLabel = "Critical";
        debtMessage = "Debt without income";
    }

    // =========================================================================
    // 4. GOAL PROGRESS (20%)
    // =========================================================================
    let goalScore = 40; // Default if no goals
    let goalLabel = "Not Set";
    let goalMessage = "Add goals to track";

    const allGoals = [...(shortTermGoals || []), ...(longTermGoals || [])];

    if (allGoals.length > 0) {
        let totalProgress = 0;
        let completedCount = 0;
        let validGoals = 0;

        allGoals.forEach(g => {
            if (g.isCompleted) {
                totalProgress += 1;
                completedCount++;
                validGoals++;
            } else if (g.targetAmount > 0) {
                totalProgress += Math.min(1, (g.currentAmount || 0) / g.targetAmount);
                validGoals++;
            }
        });

        if (validGoals > 0) {
            const avgProgress = totalProgress / validGoals;
            const completionBonus = Math.min(20, completedCount * 10);

            goalScore = Math.min(100, (avgProgress * 80) + completionBonus);

            if (goalScore >= 85) {
                goalLabel = "Crushing It";
                goalMessage = "Outstanding progress!";
            } else if (goalScore >= 65) {
                goalLabel = "On Track";
                goalMessage = "Great momentum";
            } else if (goalScore >= 40) {
                goalLabel = "Progressing";
                goalMessage = "Keep going";
            } else {
                goalLabel = "Starting";
                goalMessage = "Building momentum";
            }
        }
    }

    // =========================================================================
    // FINAL WEIGHTED SCORE
    // =========================================================================

    // Adjusted weights to prioritize Cash Flow (Stability) more, as requested.
    // High income/surplus should have a stronger impact on "stability".
    const weights = {
        cashFlow: 0.40, // Increased from 0.30
        savings: 0.20,  // Decreased from 0.30 (Income can compensate for low savings temporarily)
        debt: 0.20,
        goals: 0.20
    };

    // Boost: If user has a massive surplus (e.g. > 500,000 or > 5x expenses), they are very stable.
    let stabilityBonus = 0;
    const surplus = monthlyIncome - totalExpenses;
    if (surplus > 0) {
        if (surplus > 500000) stabilityBonus += 15;
        else if (surplus > 100000) stabilityBonus += 10;
        else if (surplus > 50000) stabilityBonus += 5;

        // Also boost if surplus covers expenses multiple times (High Savings Rate Potential)
        if (monthlyIncome > 0 && totalExpenses > 0) {
            const coverage = surplus / totalExpenses;
            if (coverage > 2) stabilityBonus += 5; // Can save 2x expenses per month
        }
    }

    let weightedScore = (
        (cashFlowScore * weights.cashFlow) +
        (savingsScore * weights.savings) +
        (debtScore * weights.debt) +
        (goalScore * weights.goals)
    );

    // Apply bonus (cap total score at 100)
    weightedScore += stabilityBonus;

    // Ensure score is properly bounded
    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

    return {
        totalScore: finalScore,
        breakdown: [
            {
                id: 'cashflow',
                label: 'Cash Flow',
                score: Math.round(Math.min(100, Math.max(0, cashFlowScore))),
                status: cashFlowLabel,
                description: cashFlowMessage,
                weight: weights.cashFlow * 100,
                color: '#10b981' // Emerald
            },
            {
                id: 'savings',
                label: 'Savings',
                score: Math.round(Math.min(100, Math.max(0, savingsScore))),
                status: savingsLabel,
                description: savingsMessage,
                weight: weights.savings * 100,
                color: '#3b82f6' // Blue
            },
            {
                id: 'debt',
                label: 'Debt',
                score: Math.round(Math.min(100, Math.max(0, debtScore))),
                status: debtLabel,
                description: debtMessage,
                weight: weights.debt * 100,
                color: '#f59e0b' // Amber
            },
            {
                id: 'goals',
                label: 'Goals',
                score: Math.round(Math.min(100, Math.max(0, goalScore))),
                status: goalLabel,
                description: goalMessage,
                weight: weights.goals * 100,
                color: '#a855f7' // Purple
            }
        ]
    };
};
