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
  const typeColor = isIncome ? Colors.primary : '#ff4444';
  const amountDisplay = isIncome ? '+' : '-';
  const formattedAmount = (budget.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'income':
        return '💰';
      case 'expense':
        return '💸';
      case 'transfer':
        return '💳';
      case 'investment':
        return '📈';
      default:
        return '📝';
    }
  };

  return (
    <View style={styles.card}>
      {/* Type Indicator Bar */}
      <View style={[styles.typeBg, { backgroundColor: typeColor + '20' }]} />

      {/* Header with Title and Type Icon */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.typeIcon}>{getTypeIcon(budget.type)}</Text>
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
            📅 {new Date(budget.createdAt).toLocaleDateString('en-IN')}
          </Text>
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {budget.type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(budget)} style={styles.actionButton}>
            <Text style={styles.editButton}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.actionButton}>
            <Text style={styles.deleteButton}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  category: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  note: {
    color: Colors.secondary,
    fontSize: 12,
    marginBottom: 10,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary + '20',
  },
  footerLeft: {
    flex: 1,
  },
  date: {
    color: Colors.secondary,
    fontSize: 11,
    marginBottom: 6,
    opacity: 0.8,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '15',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  editButton: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    color: '#ff4444',
    fontSize: 11,
    fontWeight: '600',
  },
});