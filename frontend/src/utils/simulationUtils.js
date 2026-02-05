/**
 * simulationUtils.js
 * 
 * Deterministic financial simulation engine for Money Council.
 * Handles compound interest, inflation, and debt payoff strategies.
 */

// --- Constants ---
export const INFLATION_RATE = 0.06; // 6% average inflation in India
export const RETIREMENT_AGE = 60;

// Risk Profiles (Expected Annual Returns)
export const RISK_PROFILES = {
    conservative: { label: "Conservative", returnRate: 0.07, description: "FDs, Gold, Debt Funds" }, // ~7%
    balanced: { label: "Balanced", returnRate: 0.10, description: "Index Funds, Blue Chip Stocks" }, // ~10%
    aggressive: { label: "Aggressive", returnRate: 0.14, description: "Mid/Small Cap, Direct Equity" } // ~14%
};

/**
 * Calculates investment growth over time.
 * @param {number} currentCorpus - Existing investments (Lumpsum)
 * @param {number} monthlyContribution - SIP amount
 * @param {number} years - Duration
 * @param {string} riskProfile - 'conservative' | 'balanced' | 'aggressive'
 */
export const calculateWealthProjection = (currentCorpus, monthlyContribution, years, riskProfile = 'balanced') => {
    const annualRate = RISK_PROFILES[riskProfile].returnRate;
    const monthlyRate = annualRate / 12;
    const months = years * 12;

    let futureValue = currentCorpus * Math.pow(1 + annualRate, years); // Lumpsum growth (simplified annual compounding)

    // SIP Growth: FV = P * [ (1+r)^n - 1 ] / r * (1+r)
    const sipValue = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    const totalValue = futureValue + sipValue;

    // Inflation Adjusted (Real) Value
    const realValue = totalValue / Math.pow(1 + INFLATION_RATE, years);

    return {
        totalValue: Math.round(totalValue),
        realValue: Math.round(realValue),
        investedAmount: currentCorpus + (monthlyContribution * months),
        gain: Math.round(totalValue - (currentCorpus + (monthlyContribution * months)))
    };
};

/**
 * Generates data points for a growth chart/timeline.
 */
export const generateGrowthCurve = (currentCorpus, monthlyContribution, years, riskProfile) => {
    const data = [];
    let corpus = currentCorpus;
    const annualRate = RISK_PROFILES[riskProfile].returnRate;

    for (let y = 0; y <= years; y++) {
        data.push({
            year: y,
            value: Math.round(corpus),
            invested: Math.round(currentCorpus + (monthlyContribution * 12 * y))
        });
        // Simple compound for next year (approx)
        corpus = (corpus + (monthlyContribution * 12)) * (1 + annualRate);
    }
    return data;
};

/**
 * Calculates Debt Payoff Schedule.
 * strategies: 'avalanche' (highest rate first) | 'snowball' (lowest balance first)
 */
export const calculateDebtPayoff = (debts, extraPaymentMonthly, strategy = 'avalanche') => {
    // debts: [{ name: 'Credit Card', balance: 50000, rate: 0.18, minPayment: 2000 }]

    let loans = debts.map(d => ({ ...d, currentBalance: d.balance }));
    let totalInterestPaid = 0;
    let months = 0;
    const history = []; // Snapshot of balances each month

    // Sort loans based on strategy
    const sortLoans = (loanList) => {
        if (strategy === 'avalanche') {
            return loanList.sort((a, b) => b.rate - a.rate); // Highest rate first
        } else {
            return loanList.sort((a, b) => a.currentBalance - b.currentBalance); // Lowest balance first
        }
    };

    while (loans.some(l => l.currentBalance > 0) && months < 360) { // Cap at 30 years to prevent infinite loops
        months++;
        let monthlyBudget = loans.reduce((sum, l) => sum + l.minPayment, 0) + extraPaymentMonthly;

        // Accrue interest
        loans.forEach(loan => {
            if (loan.currentBalance > 0) {
                const interest = loan.currentBalance * (loan.rate / 12); // rate is annual decimal
                loan.currentBalance += interest;
                totalInterestPaid += interest;
            }
        });

        // Pay minimums
        loans.forEach(loan => {
            if (loan.currentBalance > 0) {
                const payment = Math.min(loan.currentBalance, loan.minPayment);
                loan.currentBalance -= payment;
                monthlyBudget -= payment;
            }
        });

        // Pay extra to priority loan
        loans = sortLoans(loans);
        for (let loan of loans) {
            if (monthlyBudget <= 0) break;
            if (loan.currentBalance > 0) {
                const payment = Math.min(loan.currentBalance, monthlyBudget);
                loan.currentBalance -= payment;
                monthlyBudget -= payment;
            }
        }

        // Record history for visualization
        history.push({
            month: months,
            remainingDebt: Math.round(loans.reduce((sum, l) => sum + l.currentBalance, 0)),
            totalInterest: Math.round(totalInterestPaid)
        });
    }

    return {
        monthsToPayoff: months,
        totalInterestPaid: Math.round(totalInterestPaid),
        history
    };
};
