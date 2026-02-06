import { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import BudgetCard from '../components/BudgetCard';
import TotalBalance from '../components/TotalBalance';
import FilterBar from '../components/FilterBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api, API_ENDPOINTS } from '../config/api';

export default function DashboardScreen() {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const syncingRef = useRef(false);

  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMonth, setFilterMonth] = useState('0');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterRange, setFilterRange] = useState('all');

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) syncWithServer();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { loadTransactionsLocal(); }, []);

  async function loadTransactionsLocal() {
    const localTransactions = await AsyncStorage.getItem('transactions');
    setTransactions(localTransactions ? JSON.parse(localTransactions) : []);
  }

  async function saveTransactionsLocal(newTransactions) {
    setTransactions(newTransactions);
    await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
  }

  async function handleDelete(id) {
    const newTransactions = transactions.filter(t => t._id !== id);
    await saveTransactionsLocal(newTransactions);
    await addToUnsyncedQueue({ action: 'delete', id });
    if (isOnline) syncWithServer();
  }

  async function addToUnsyncedQueue(change) {
    const queue = await AsyncStorage.getItem('unsyncedTransactions');
    const unsynced = queue ? JSON.parse(queue) : [];
    const alreadyExists = unsynced.some(item => {
      if (change.action === 'add' && item.action === 'add') return item.transaction?._id === change.transaction?._id;
      if (change.action === 'delete' && item.action === 'delete') return item.id === change.id;
      if (change.action === 'edit' && item.action === 'edit') return item.transaction?._id === change.transaction?._id;
      return false;
    });
    if (!alreadyExists) {
      unsynced.push(change);
      await AsyncStorage.setItem('unsyncedTransactions', JSON.stringify(unsynced));
    }
  }

  async function syncWithServer() {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const firebaseUid = await AsyncStorage.getItem('firebaseUid');
      if (!firebaseUid) {
        console.log('No firebaseUid found, skipping sync');
        return;
      }

      let queue = await AsyncStorage.getItem('unsyncedTransactions');
      let unsynced = queue ? JSON.parse(queue) : [];

      // Keep only the latest change per transaction id
      const map = new Map();
      for (let i = unsynced.length - 1; i >= 0; i--) {
        const c = unsynced[i];
        const key = c.action === 'delete' ? c.id : c.transaction?._id;
        if (!map.has(key)) map.set(key, c);
      }
      unsynced = Array.from(map.values()).reverse();

      // Sync unsynced changes
      const newQueue = [];
      for (const change of unsynced) {
        let success = false;
        try {
          if (change.action === 'add') {
            await api.post(API_ENDPOINTS.TRANSACTIONS.CREATE, change.transaction);
            success = true;
          } else if (change.action === 'edit') {
            await api.put(API_ENDPOINTS.TRANSACTIONS.UPDATE(change.transaction._id), change.transaction);
            success = true;
          } else if (change.action === 'delete') {
            await api.delete(API_ENDPOINTS.TRANSACTIONS.DELETE(change.id));
            success = true;
          }
        } catch (e) {
          console.error('Sync error:', e);
          success = false;
        }
        if (!success) newQueue.push(change);
      }

      await AsyncStorage.setItem('unsyncedTransactions', JSON.stringify(newQueue));
      
      // Fetch latest transactions from server
      const response = await api.get(API_ENDPOINTS.TRANSACTIONS.GET_ALL(firebaseUid), {
        params: { limit: 100, sortBy: 'date', sortOrder: 'desc' }
      });
      
      if (response.data.success) {
        await saveTransactionsLocal(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      syncingRef.current = false;
    }
  }

  function handleEdit(transaction) {
    router.push({
      pathname: '/add-transaction',
      params: {
        edit: 'true',
        transactionId: transaction._id,
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        merchant: transaction.merchant || '',
        notes: transaction.notes || '',
        paymentMethod: transaction.paymentMethod || 'cash',
      }
    });
  }

  async function onRefresh() {
    setRefreshing(true);
    if (isOnline) await syncWithServer();
    else await loadTransactionsLocal();
    setRefreshing(false);
  }

  const filteredTransactions = useMemo(() => {
    let arr = [...transactions];
    if (filterType !== 'all') arr = arr.filter(t => t.type === filterType);
    if (filterCategory !== 'All') arr = arr.filter(t => t.category === filterCategory);
    if (filterMonth !== '0' || filterYear !== new Date().getFullYear().toString()) {
      arr = arr.filter(t => {
        const d = new Date(t.date || t.createdAt);
        const monthMatch = filterMonth === '0' || (d.getMonth() + 1).toString() === filterMonth;
        const yearMatch = filterYear === 'All' || d.getFullYear().toString() === filterYear;
        return monthMatch && yearMatch;
      });
    }
    if (filterRange !== 'all') {
      const now = new Date();
      arr = arr.filter(t => {
        const d = new Date(t.date || t.createdAt);
        if (filterRange === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo && d <= now;
        }
        if (filterRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filterRange === 'year') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    return arr;
  }, [transactions, filterType, filterCategory, filterMonth, filterYear, filterRange]);

  // Convert transactions to budget format for compatibility with existing components
  const budgetsForDisplay = filteredTransactions.map(t => ({
    _id: t._id,
    title: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    note: t.notes || t.merchant,
    createdAt: t.date || t.createdAt,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      {/* Balance Card */}
      <TotalBalance budgets={budgetsForDisplay} />

      {/* Add Transaction Button - Prominent */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => router.push('/add-transaction')}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>➕ Add Transaction</Text>
      </TouchableOpacity>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <TouchableOpacity style={styles.filterToggle}>
          <Text style={styles.filterToggleText}>🔍 Show Filters</Text>
        </TouchableOpacity>
        <FilterBar
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          filterRange={filterRange}
          setFilterRange={setFilterRange}
        />
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>
          {budgetsForDisplay.length === 0 ? 'No transactions' : `${budgetsForDisplay.length} Transaction${budgetsForDisplay.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {budgetsForDisplay.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateText}>No transactions found</Text>
          <Text style={styles.emptyStateSubtext}>Add your first transaction to get started</Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {budgetsForDisplay.map(item => (
            <BudgetCard 
              key={item._id} 
              budget={item} 
              onDelete={handleDelete} 
              onEdit={() => handleEdit(filteredTransactions.find(t => t._id === item._id))} 
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.dark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  addButton: { 
    backgroundColor: Colors.primary, 
    marginHorizontal: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: { 
    color: Colors.dark, 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.3,
  },
  filtersSection: {
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  filterToggle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    borderColor: Colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  transactionsTitle: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionsList: {
    paddingHorizontal: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: Colors.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});