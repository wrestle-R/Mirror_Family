import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../constants/colors';

export default function BudgetCard({ budget, onDelete, onEdit }) {
  function confirmDelete() {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(budget._id) },
      ]
    );
  }

  const isIncome = budget.type === 'income';
  const typeColor = isIncome ? Colors.light.primary : Colors.light.destructive;
  const amountDisplay = isIncome ? '+' : '-';
  const formattedAmount = (budget.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      {/* Type Indicator Bar */}
      <View style={[styles.typeBg, { backgroundColor: typeColor + '20' }]} />

      {/* Header with Title */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {budget.title || budget.category}
            </Text>
            <Text style={styles.category}>
              {budget.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: typeColor }]}>
          {amountDisplay}₹{formattedAmount}
        </Text>
      </View>

      {/* Note/Merchant */}
      {budget.note && (
        <Text style={styles.note} numberOfLines={1}>
          {budget.note}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.date}>
            {new Date(budget.createdAt).toLocaleDateString('en-IN')}
          </Text>
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {budget.type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(budget)} style={styles.actionButton}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.actionButton}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingTop: 4,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.light.foreground,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  category: {
    color: Colors.light.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  note: {
    color: Colors.light.mutedForeground,
    fontSize: 13,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerLeft: {
    flex: 1,
  },
  date: {
    color: Colors.light.mutedForeground,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.light.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editButton: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    color: Colors.light.destructive,
    fontSize: 11,
    fontWeight: '600',
  },
});