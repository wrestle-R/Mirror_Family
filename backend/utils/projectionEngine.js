// Backend projection engine for Financial Time Machine

const calculateFutureValue = (principal, monthlyContribution, rate, years) => {
    const months = years * 12;
    const monthlyRate = rate / 12;
    if (rate === 0) return principal + (monthlyContribution * months);
    const fvLumpSum = principal * Math.pow(1 + monthlyRate, months);
    const fvContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return Math.round(fvLumpSum + fvContributions);
};

const calculateProjections = (profile) => {
    const {
        monthlyIncome = 0, monthlyBudget = 0, currentSavings = 0, totalDebt = 0,
        rentExpense = 0, foodExpense = 0, transportationExpense = 0,
        utilitiesExpense = 0, otherExpenses = 0
    } = profile;

    const totalExpenses = (rentExpense + foodExpense + transportationExpense + utilitiesExpense + otherExpenses) || monthlyBudget;
    const monthlySurplus = Math.max(0, monthlyIncome - totalExpenses);
    const years = 10;
    const inflationRate = 0.05;
    const safeRate = 0.035;
    const growthRate = 0.12;

    const currentPathData = [];
    let cSavings = currentSavings, cDebt = totalDebt;

    const flexibleExpenses = foodExpense + transportationExpense + utilitiesExpense + otherExpenses;
    const optimizedTotalExpenses = rentExpense + (flexibleExpenses * 0.85);
    const optimizedSurplus = Math.max(0, monthlyIncome - optimizedTotalExpenses);
    const optimizedPathData = [];
    let oSavings = currentSavings, oDebt = totalDebt;

    for (let year = 1; year <= years; year++) {
        const yearlySurplusCurrent = monthlySurplus * 12 * Math.pow(1 + inflationRate, year - 1);
        if (cDebt > 0) cDebt = Math.max(0, cDebt * 0.90);
        cSavings = (cSavings * (1 + safeRate)) + yearlySurplusCurrent;
        currentPathData.push({ year: 2026 + year, savings: Math.round(cSavings), debt: Math.round(cDebt), netWorth: Math.round(cSavings - cDebt) });

        let yearlySurplusOpt = optimizedSurplus * 12 * Math.pow(1 + inflationRate, year - 1);
        if (oDebt > 0) {
            if (yearlySurplusOpt >= oDebt) { yearlySurplusOpt -= oDebt; oDebt = 0; }
            else { oDebt -= yearlySurplusOpt; oDebt *= 1.05; yearlySurplusOpt = 0; }
        }
        oSavings = (oSavings * (1 + growthRate)) + yearlySurplusOpt;
        optimizedPathData.push({ year: 2026 + year, savings: Math.round(oSavings), debt: Math.round(oDebt), netWorth: Math.round(oSavings - oDebt) });
    }

    const inf10 = Math.pow(1 + inflationRate, years);
    const incomeAt10 = Math.round(monthlyIncome * inf10);
    const finalCurrent = currentPathData[years - 1];
    const finalOptimized = optimizedPathData[years - 1];

    return {
        currentPath: currentPathData,
        optimizedPath: optimizedPathData,
        dashboardCards: {
            current: {
                monthlyIncome: incomeAt10,
                monthlyExpenses: Math.round(totalExpenses * inf10),
                netBalance: incomeAt10 - Math.round(totalExpenses * inf10),
                savings: finalCurrent.savings, debt: finalCurrent.debt, netWorth: finalCurrent.netWorth,
                budgetBreakdown: {
                    rent: Math.round(rentExpense * inf10), food: Math.round(foodExpense * inf10),
                    transport: Math.round(transportationExpense * inf10), utilities: Math.round(utilitiesExpense * inf10),
                    other: Math.round(otherExpenses * inf10)
                }
            },
            optimized: {
                monthlyIncome: incomeAt10,
                monthlyExpenses: Math.round(optimizedTotalExpenses * inf10),
                netBalance: incomeAt10 - Math.round(optimizedTotalExpenses * inf10),
                savings: finalOptimized.savings, debt: finalOptimized.debt, netWorth: finalOptimized.netWorth,
                budgetBreakdown: {
                    rent: Math.round(rentExpense * inf10), food: Math.round(foodExpense * 0.85 * inf10),
                    transport: Math.round(transportationExpense * 0.85 * inf10), utilities: Math.round(utilitiesExpense * 0.85 * inf10),
                    other: Math.round(otherExpenses * 0.85 * inf10)
                }
            }
        },
        originalBudget: {
            today: { rent: rentExpense, food: foodExpense, transport: transportationExpense, utilities: utilitiesExpense, other: otherExpenses },
            todayOptimized: { rent: rentExpense, food: Math.round(foodExpense * 0.85), transport: Math.round(transportationExpense * 0.85), utilities: Math.round(utilitiesExpense * 0.85), other: Math.round(otherExpenses * 0.85) },
            todayTotal: totalExpenses,
            todayOptimizedTotal: Math.round(optimizedTotalExpenses),
            monthlySavingsUnlocked: Math.round(optimizedSurplus - monthlySurplus),
        },
        metrics: {
            currentNetWorthProjection: finalCurrent.netWorth,
            optimizedNetWorthProjection: finalOptimized.netWorth,
            wealthGap: finalOptimized.netWorth - finalCurrent.netWorth
        }
    };
};

module.exports = { calculateProjections, calculateFutureValue };
