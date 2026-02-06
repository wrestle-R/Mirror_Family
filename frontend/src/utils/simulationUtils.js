
import { useState, useCallback } from 'react';
import { calculateFinancialHealth } from './healthScoreUtils';
import { calculateGoalTimeline } from './goalTimelineUtils';

/**
 * Hook to manage financial simulation state.
 * Allows temporary modification of profile data to see impact on Health Score and Timeline.
 */
export const useFinancialSimulation = (initialProfile) => {
    // Deep copy to avoid reference issues, though spread is usually enough for 1-level
    const [simulatedProfile, setSimulatedProfile] = useState(() => ({ ...initialProfile }));

    // Track what has changed for UI highlighting
    const [changedFields, setChangedFields] = useState({});

    const updateSimulation = useCallback((field, value) => {
        setSimulatedProfile(prev => {
            const updated = { ...prev, [field]: Number(value) };

            // Dependent logic: e.g. if savings change, net worth might theoretically change (not tracked here)
            // or if monthly debt payment changes, total debt might need context (but we simulate payment flow)

            return updated;
        });

        setChangedFields(prev => ({
            ...prev,
            [field]: true
        }));
    }, []);

    const resetSimulation = useCallback(() => {
        setSimulatedProfile({ ...initialProfile });
        setChangedFields({});
    }, [initialProfile]);

    // Derived Metrics
    const healthScore = calculateFinancialHealth(simulatedProfile);
    const timelineData = calculateGoalTimeline(
        simulatedProfile.currentSavings,
        simulatedProfile.shortTermGoals || [],
        simulatedProfile.longTermGoals || []
    );

    return {
        simulatedProfile,
        updateSimulation,
        resetSimulation,
        changedFields,
        healthScore,
        timelineData
    };
};

/**
 * Calculates debt payoff details based on strategy (Avalanche/Snowball).
 * This function simulates month-by-month payments.
 * 
 * @param {Array} debts - Array of debt objects { balance, rate, minPayment }
 * @param {number} extraPayment - Total extra monthly payment available
 * @param {string} strategy - 'avalanche' (highest rate first) or 'snowball' (lowest balance first)
 */
export const calculateDebtPayoff = (debts, extraPayment = 0, strategy = 'avalanche') => {
    // Deep copy debts to simulate without mutating
    let currentDebts = debts.map(d => ({ ...d }));
    let history = [];
    let totalInterestPaid = 0;
    let months = 0;

    // Sort debts based on strategy
    const sortDebts = (list) => {
        return list.sort((a, b) => {
            if (strategy === 'avalanche') return b.rate - a.rate; // Highest rate first
            return a.balance - b.balance; // Lowest balance first
        });
    };

    while (currentDebts.some(d => d.balance > 0) && months < 600) { // Cap at 50 years to prevent infinite loops
        months++;
        let monthlyExtra = extraPayment;
        let monthlyInterest = 0;
        let currentTotalBalance = 0;

        // 1. Accrue Interest & Pay Minimums
        currentDebts.forEach(d => {
            if (d.balance > 0) {
                // Monthly interest (assuming rate is annual APR)
                const interest = d.balance * (d.rate / 12);
                d.balance += interest;
                monthlyInterest += interest;
                totalInterestPaid += interest;

                // Pay minimum
                const payment = Math.min(d.balance, d.minPayment);
                d.balance -= payment;

                // If minimum payment was more than balance, add excess to "snowball" (extra payment bucket)
                if (d.minPayment > payment) {
                    monthlyExtra += (d.minPayment - payment);
                }
            }
        });

        // 2. Pay Extra to Target Debt
        // Resort to find current target (in case balances changed order for snowball, though usually target stays same until paid)
        sortDebts(currentDebts);

        for (let d of currentDebts) {
            if (d.balance > 0 && monthlyExtra > 0) {
                const payment = Math.min(d.balance, monthlyExtra);
                d.balance -= payment;
                monthlyExtra -= payment;
            }
        }

        currentTotalBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);

        // Record history snapshot (sparse to save memory if needed, but here we do every month)
        history.push({
            month: months,
            remainingDebt: Math.round(currentTotalBalance),
            totalInterest: Math.round(totalInterestPaid)
        });

        if (currentTotalBalance < 1) break; // Debts cleared
    }

    return {
        monthsToPayoff: months,
        totalInterestPaid: Math.round(totalInterestPaid),
        history
    };
};

/**
 * RESTORED UTILITIES FOR INVESTMENT AGENT
 * These were inadvertently removed when adding new features.
 */

export const RISK_PROFILES = {
    conservative: {
        label: "Conservative",
        returnRate: 0.08, // 8%
        description: "Low risk, steady growth. Focus on capital preservation.",
        allocation: { equity: 20, debt: 80 }
    },
    balanced: {
        label: "Balanced",
        returnRate: 0.12, // 12%
        description: "Moderate risk, healthy growth. A mix of stability and performance.",
        allocation: { equity: 50, debt: 50 }
    },
    aggressive: {
        label: "Aggressive",
        returnRate: 0.15, // 15%
        description: "High risk, maximum growth. Focus on long-term wealth creation.",
        allocation: { equity: 80, debt: 20 }
    }
};

/**
 * Calculates projected wealth based on SIP and Risk Profile
 */
export const calculateWealthProjection = (currentCorpus = 0, monthlyInvestment = 0, years = 5, riskProfile = 'balanced') => {
    const rate = RISK_PROFILES[riskProfile].returnRate;
    const monthlyRate = rate / 12;
    const months = years * 12;

    // Future Value of Current Corpus (Lump Sum)
    const fvLumpSum = currentCorpus * Math.pow(1 + rate, years);

    // Future Value of SIP: P * ({[1 + i]^n - 1} / i) * (1 + i)
    let fvSIP = 0;
    if (monthlyInvestment > 0) {
        fvSIP = monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const totalValue = fvLumpSum + fvSIP;
    const totalInvested = currentCorpus + (monthlyInvestment * months);
    const gain = totalValue - totalInvested;

    return {
        totalValue: Math.round(totalValue),
        totalInvested: Math.round(totalInvested),
        gain: Math.round(gain)
    };
};

/**
 * Generates year-on-year growth curve data
 */
export const generateGrowthCurve = (currentCorpus = 0, monthlyInvestment = 0, years = 5, riskProfile = 'balanced') => {
    const data = [];
    const rate = RISK_PROFILES[riskProfile].returnRate;

    for (let i = 0; i <= years; i++) {
        const res = calculateWealthProjection(currentCorpus, monthlyInvestment, i, riskProfile);
        data.push({
            year: i,
            value: res.totalValue,
            invested: res.totalInvested
        });
    }
    return data;
};
