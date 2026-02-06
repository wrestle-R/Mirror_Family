import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function TotalBalance({ budgets }) {
  // Safely calculate balance with proper number conversion
  let totalIncome = 0;
  let totalExpense = 0;

  if (Array.isArray(budgets)) {
    budgets.forEach(b => {
      const amount = parseFloat(b.amount) || 0;
      if (isFinite(amount) && amount >= 0) {
        if (b.type === 'income') {
          totalIncome += amount;
        } else if (b.type === 'expense') {
          totalExpense += amount;
        }
      }
    });
  }

  const netBalance = totalIncome - totalExpense;
  const isPositive = netBalance >= 0;

  // Format number with commas
  const formatCurrency = (num) => {
    return Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.label}>Total Balance</Text>

      {/* Main Balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={[styles.amount, { color: isPositive ? Colors.primary : '#ff4444' }]}>
          {isPositive ? '' : '-'}{formatCurrency(netBalance)}
        </Text>
      </View>

      {/* Income & Expense Breakdown */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Income</Text>
          <Text style={styles.breakdownValue}>+₹{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Expense</Text>
          <Text style={[styles.breakdownValue, { color: '#ff4444' }]}>-₹{formatCurrency(totalExpense)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  label: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currencySymbol: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  breakdown: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary + '30',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    backgroundColor: Colors.secondary + '30',
  },
  breakdownLabel: {
    color: Colors.secondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  breakdownValue: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});