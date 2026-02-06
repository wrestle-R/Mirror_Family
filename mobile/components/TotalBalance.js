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
        <Text style={[styles.amount, { color: isPositive ? Colors.light.primary : Colors.light.destructive }]}>
          {isPositive ? '' : '-'}{formatCurrency(netBalance)}
        </Text>
      </View>

      {/* Income & Expense Breakdown */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Income</Text>
          <Text style={[styles.breakdownValue, { color: Colors.light.primary }]}>+₹{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Expense</Text>
          <Text style={[styles.breakdownValue, { color: Colors.light.destructive }]}>-₹{formatCurrency(totalExpense)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    color: Colors.light.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currencySymbol: {
    color: Colors.light.primary,
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  breakdown: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  breakdownLabel: {
    color: Colors.light.mutedForeground,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  breakdownValue: {
    color: Colors.light.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
});