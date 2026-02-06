
/**
 * Calculates a comprehensive Financial Health Score (0-100) based on user profile data.
 * The score is 100% deterministic and derived from existing fields.
 * 
 * Components:
 * 1. Cash Flow Health (30%): Income vs Expenses
 * 2. Savings Discipline (30%): Current Savings vs Goal & Income
 * 3. Debt Pressure (20%): Debt-to-Income & Total Debt
 * 4. Goal Progress (20%): Active & Completed Goals
 */

export const calculateFinancialHealth = (profile) => {
    if (!profile) return { totalScore: 0, breakdown: [] };

    const {
        monthlyIncome = 0,
        monthlyBudget = 0,
        currentSavings = 0,
        savingsGoal = 0,
        totalDebt = 0,
        debtPaymentMonthly = 0,
        shortTermGoals = [],
        longTermGoals = [],
        // Expenses
        rentExpense = 0,
        foodExpense = 0,
        transportationExpense = 0,
        utilitiesExpense = 0,
        otherExpenses = 0,
    } = profile;

    const totalExpenses = rentExpense + foodExpense + transportationExpense + utilitiesExpense + otherExpenses;

    // --- 1. Cash Flow Health (30%) ---
    // Ideal: Expenses <= 80% of Income (20% surplus)
    // Critical: Expenses >= Income
    let cashFlowScore = 0;
    let cashFlowLabel = "Critical";
    let cashFlowMessage = "Expenses exceed income";

    if (monthlyIncome > 0) {
        const expenseRatio = totalExpenses / monthlyIncome;
        if (expenseRatio <= 0.5) {
            cashFlowScore = 100;
            cashFlowLabel = "Strong";
            cashFlowMessage = "Excellent surplus (>50%)";
        } else if (expenseRatio <= 0.8) {
            // Linear interpolation between 0.5 (100) and 0.8 (70)
            cashFlowScore = 70 + ((0.8 - expenseRatio) / 0.3) * 30;
            cashFlowLabel = "Good";
            cashFlowMessage = "Healthy surplus (20%+)";
        } else if (expenseRatio <= 1.0) {
            // Linear interpolation between 0.8 (70) and 1.0 (40)
            cashFlowScore = 40 + ((1.0 - expenseRatio) / 0.2) * 30;
            cashFlowLabel = "Fair";
            cashFlowMessage = "Tight budget, low surplus";
        } else {
            // Overspending
            cashFlowScore = Math.max(0, 40 - ((expenseRatio - 1.0) * 100));
            cashFlowLabel = "Poor";
            cashFlowMessage = "Spending exceeds income";
        }
    } else if (totalExpenses === 0) {
        // No data
        cashFlowScore = 50;
        cashFlowLabel = "Unknown";
        cashFlowMessage = "Add income/expenses to track";
    }

    // --- 2. Savings Discipline (30%) ---
    // Based on Savings vs Goal. If no goal, check Savings vs Income (Emergency Fund proxy)
    let savingsScore = 0;
    let savingsLabel = "Low";
    let savingsMessage = "Start saving today";

    if (savingsGoal > 0) {
        const progress = Math.min(1, currentSavings / savingsGoal);
        savingsScore = progress * 100;
        if (progress >= 1) {
            savingsLabel = "Strong";
            savingsMessage = "Goal achieved!";
        } else if (progress >= 0.5) {
            savingsLabel = "Good";
            savingsMessage = "Halfway to goal";
        } else if (progress >= 0.2) {
            savingsLabel = "Fair";
            savingsMessage = "Making progress";
        } else {
            savingsLabel = "Needs Focus";
            savingsMessage = "Just started";
        }
    } else {
        // Fallback: If no specific goal, look at savings relative to monthly expenses
        // Ideal: 3-6 months of expenses
        if (totalExpenses > 0) {
            const monthsCovered = currentSavings / totalExpenses;
            if (monthsCovered >= 6) savingsScore = 100;
            else savingsScore = (monthsCovered / 6) * 100;

            savingsLabel = monthsCovered >= 3 ? "Good" : "Fair";
            savingsMessage = `${monthsCovered.toFixed(1)} months covered`;
        } else if (currentSavings > 1000) {
            savingsScore = 60; // Arbitrary entry level
            savingsLabel = "Fair";
            savingsMessage = "Good start";
        }
    }

    // --- 3. Debt Pressure (20%) ---
    // DTI (Debt to Income). 
    // 0% -> 100 score. >40% -> 0 score.
    let debtScore = 100;
    let debtLabel = "Free";
    let debtMessage = "Debt free";

    if (totalDebt > 0 || debtPaymentMonthly > 0) {
        if (monthlyIncome > 0) {
            const dti = debtPaymentMonthly / monthlyIncome;
            if (dti === 0 && totalDebt > 0) {
                // Has debt but no payment? Moderate penalty assuming standard terms
                debtScore = 70;
                debtLabel = "Manageable";
                debtMessage = "Active debt";
            } else {
                // Linear scale: 0% DTI = 100, 40% DTI = 0
                debtScore = Math.max(0, 100 - (dti / 0.4) * 100);

                if (dti < 0.15) {
                    debtLabel = "Low";
                    debtMessage = "Manageable payments";
                } else if (dti < 0.30) {
                    debtLabel = "Moderate";
                    debtMessage = "Watch your DTI";
                } else {
                    debtLabel = "High";
                    debtMessage = "Heavy debt burden";
                }
            }
        } else {
            debtScore = 20; // Has debt, no income? Bad.
            debtLabel = "Critical";
            debtMessage = "Debt without income";
        }
    }

    // --- 4. Goal Progress (20%) ---
    // Average progress of active goals + bonus for completion
    let goalScore = 50; // Neutral start
    let goalLabel = "Steady";
    let goalMessage = "No active goals";

    const allGoals = [...shortTermGoals, ...longTermGoals];
    if (allGoals.length > 0) {
        let totalProgress = 0;
        allGoals.forEach(g => {
            if (g.isCompleted) totalProgress += 1;
            else if (g.targetAmount > 0) {
                totalProgress += Math.min(1, (g.currentAmount || 0) / g.targetAmount);
            }
        });

        const avgProgress = totalProgress / allGoals.length;
        goalScore = avgProgress * 100;

        // Bonus for having more goals? No, stick to progress.
        if (goalScore >= 80) { goalLabel = "Crushing It"; goalMessage = " Consistent progress"; }
        else if (goalScore >= 50) { goalLabel = "On Track"; goalMessage = "Keep going"; }
        else { goalLabel = "Starting"; goalMessage = "Needs momentum"; }
    } else {
        goalScore = 0;
        goalLabel = "None";
        goalMessage = "Set goals to track";
    }

    // --- Weighted Average ---
    // If some data is missing (e.g. income is 0), we re-weight or just penalty?
    // User said "derived entirely from existing". If existing is empty, score is low.
    // We'll stick to fixed weights for consistency.

    const weightedScore = (
        (cashFlowScore * 0.30) +
        (savingsScore * 0.30) +
        (debtScore * 0.20) +
        (goalScore * 0.20)
    );

    return {
        totalScore: Math.round(weightedScore),
        breakdown: [
            {
                id: 'cashflow',
                label: 'Cash Flow',
                score: Math.round(cashFlowScore),
                status: cashFlowLabel,
                description: cashFlowMessage,
                weight: 30,
                color: 'var(--color-emerald-500, #10b981)'
            },
            {
                id: 'savings',
                label: 'Savings',
                score: Math.round(savingsScore),
                status: savingsLabel,
                description: savingsMessage,
                weight: 30,
                color: 'var(--color-blue-500, #3b82f6)'
            },
            {
                id: 'debt',
                label: 'Debt Mgmt',
                score: Math.round(debtScore),
                status: debtLabel,
                description: debtMessage,
                weight: 20,
                color: 'var(--color-amber-500, #f59e0b)'
            },
            {
                id: 'goals',
                label: 'Goals',
                score: Math.round(goalScore),
                status: goalLabel,
                description: goalMessage,
                weight: 20,
                color: 'var(--color-purple-500, #a855f7)'
            }
        ]
    };
};
