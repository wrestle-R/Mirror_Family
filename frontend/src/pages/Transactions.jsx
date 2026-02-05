import { Fragment, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Search, Filter, ArrowUpRight, ArrowDownRight, Calendar, Trash2, Edit2,
  ChevronLeft, ChevronRight, Download, SlidersHorizontal, X, Plus,
  TrendingUp, TrendingDown, Wallet, MoreVertical, Loader2, Utensils, Car, Film,
  ShoppingBag, Lightbulb, Home, BookOpen, Hospital, ShoppingCart, Smartphone,
  Package, Briefcase, Gift, GraduationCap, Banknote, Laptop, ArrowLeftRight,
  BarChart3, DollarSign, Plane, Dumbbell, Sparkles, Shield
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', Icon: Utensils },
  { value: 'transportation', label: 'Transportation', Icon: Car },
  { value: 'entertainment', label: 'Entertainment', Icon: Film },
  { value: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { value: 'utilities', label: 'Utilities', Icon: Lightbulb },
  { value: 'rent', label: 'Rent', Icon: Home },
  { value: 'education', label: 'Education', Icon: BookOpen },
  { value: 'healthcare', label: 'Healthcare', Icon: Hospital },
  { value: 'groceries', label: 'Groceries', Icon: ShoppingCart },
  { value: 'subscriptions', label: 'Subscriptions', Icon: Smartphone },
  { value: 'dining_out', label: 'Dining Out', Icon: Utensils },
  { value: 'clothing', label: 'Clothing', Icon: ShoppingBag },
  { value: 'electronics', label: 'Electronics', Icon: Smartphone },
  { value: 'travel', label: 'Travel', Icon: Plane },
  { value: 'fitness', label: 'Fitness', Icon: Dumbbell },
  { value: 'personal_care', label: 'Personal Care', Icon: Sparkles },
  { value: 'gifts_donations', label: 'Gifts & Donations', Icon: Gift },
  { value: 'insurance', label: 'Insurance', Icon: Shield },
  { value: 'other_expense', label: 'Other', Icon: Package }
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', Icon: Briefcase },
  { value: 'allowance', label: 'Allowance', Icon: Banknote },
  { value: 'freelance', label: 'Freelance', Icon: Laptop },
  { value: 'scholarship', label: 'Scholarship', Icon: GraduationCap },
  { value: 'gift', label: 'Gift', Icon: Gift },
  { value: 'refund', label: 'Refund', Icon: ArrowLeftRight },
  { value: 'investment_return', label: 'Investment Return', Icon: BarChart3 },
  { value: 'other_income', label: 'Other', Icon: DollarSign }
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' }
];

const Transactions = () => {
  const { user } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: null,
    endDate: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Edit/Delete
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState('expense');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date(),
    paymentMethod: 'upi',
    merchant: ''
  });

  const [receiptImages, setReceiptImages] = useState([]);
  const [importingBills, setImportingBills] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchTransactions();
    }
  }, [user, filters, pagination.page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '15',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const [transactionsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/transactions/${user.uid}?${params}`),
        axios.get(`${API_URL}/api/transactions/stats/${user.uid}?period=month`)
      ]);

      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data.transactions);
        setPagination(prev => ({
          ...prev,
          ...transactionsRes.data.data.pagination
        }));
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || Number(newTransaction.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/api/transactions`, {
        firebaseUid: user.uid,
        type: newTransactionType,
        amount: Number(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description,
        date: newTransaction.date,
        paymentMethod: newTransaction.paymentMethod,
        merchant: newTransaction.merchant
      });

      if (response.data.success) {
        toast.success("Transaction added successfully!");
        setShowAddModal(false);
        setReceiptImages([]);
        setPagination(prev => ({ ...prev, page: 1 }));
        setNewTransaction({
          amount: '',
          category: 'food',
          description: '',
          date: new Date(),
          paymentMethod: 'upi',
          merchant: ''
        });
        if (pagination.page === 1) fetchTransactions();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleImportBills = async () => {
    if (!receiptImages.length) {
      toast.error("Please add at least one bill photo");
      return;
    }

    setImportingBills(true);
    try {
      const formData = new FormData();
      formData.append("firebaseUid", user.uid);
      receiptImages.forEach((file) => formData.append("images", file));

      const response = await axios.post(`${API_URL}/api/transactions/import-bills`, formData);
      if (response.data.success) {
        const created = response.data.data?.created || [];
        const warnings = response.data.data?.warnings || [];
        toast.success(`Imported ${created.length} transaction(s)`);
        if (warnings.length) toast.message(warnings[0]);
        setReceiptImages([]);
        setShowAddModal(false);
        setPagination(prev => ({ ...prev, page: 1 }));
        if (pagination.page === 1) fetchTransactions();
      } else {
        toast.error(response.data.message || "Failed to import bills");
      }
    } catch (error) {
      console.error("Error importing bills:", error);
      toast.error("Failed to import bills");
    } finally {
      setImportingBills(false);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
    
    setSaving(true);
    try {
      const response = await axios.put(`${API_URL}/api/transactions/${editingTransaction._id}`, {
        amount: Number(editingTransaction.amount),
        category: editingTransaction.category,
        description: editingTransaction.description,
        date: editingTransaction.date,
        paymentMethod: editingTransaction.paymentMethod,
        merchant: editingTransaction.merchant
      });

      if (response.data.success) {
        toast.success("Transaction updated successfully!");
        setEditingTransaction(null);
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/transactions/${transactionId}`);
      
      if (response.data.success) {
        toast.success("Transaction deleted successfully!");
        setDeleteConfirm(null);
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      startDate: null,
      endDate: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getPaginationRange = (currentPage, totalPages) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const range = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const pages = Array.from(range)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
    return pages;
  };

  const getCategoryInfo = (category) => {
    const found = ALL_CATEGORIES.find(c => c.value === category);
    if (found) {
      const IconComp = found.Icon;
      return { label: found.label, icon: IconComp ? <IconComp className="w-5 h-5" /> : (found.icon || null) };
    }

    // Map transfer categories to a proper icon instead of showing an emoji fallback
    if (category === 'account_transfer') return { label: 'Account Transfer', icon: <ArrowLeftRight className="w-5 h-5" /> };
    if (category === 'savings_transfer') return { label: 'Savings Transfer', icon: <ArrowLeftRight className="w-5 h-5" /> };
    if (category === 'other_transfer') return { label: 'Transfer', icon: <ArrowLeftRight className="w-5 h-5" /> };

    return { label: category, icon: null };
  };

  const netBalance = (stats.totalIncome || 0) - (stats.totalExpense || 0);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">
            View and manage all your financial transactions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                +₹{(stats.totalIncome || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(() => {
                        const fromStats = stats?.totalExpense;
                        const fallback = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? Number(t.amount || 0) : 0), 0);
                        const display = typeof fromStats === 'number' && !Number.isNaN(fromStats) ? fromStats : fallback;
                        return `₹${(display || 0).toLocaleString()}`;
                      })()}
                    </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}₹{Math.abs(netBalance).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>

              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary/10' : ''}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {(filters.search || filters.type || filters.category || filters.startDate || filters.endDate) && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">All Categories</option>
                  <optgroup label="Expenses">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Income">
                    {INCOME_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <ReactDatePicker
                  selected={filters.startDate}
                  onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholderText="From date"
                  maxDate={filters.endDate || new Date()}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <ReactDatePicker
                  selected={filters.endDate}
                  onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholderText="To date"
                  minDate={filters.startDate}
                  maxDate={new Date()}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions ({pagination.total})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const categoryInfo = getCategoryInfo(tx.category);
                return (
                  <div 
                    key={tx._id} 
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl ${
                      tx.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {categoryInfo.icon}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="font-medium truncate min-w-0">{categoryInfo.label}</p>
                        {tx.merchant && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full max-w-[180px] truncate">
                            {tx.merchant}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(tx.date), 'MMM d, yyyy')}
                        </span>
                        {tx.paymentMethod && (
                          <span className="capitalize">{tx.paymentMethod.replace('_', ' ')}</span>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 wrap-break-word">{tx.description}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0 sm:ml-auto">
                      <p className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTransaction({...tx, date: new Date(tx.date)})}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(tx._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.page > 1) {
                              setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                            }
                          }}
                          className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {(() => {
                        const pages = getPaginationRange(pagination.page, pagination.pages);
                        return pages.map((p, idx) => {
                          const prev = pages[idx - 1];
                          const showEllipsis = idx > 0 && prev && p - prev > 1;
                          return (
                            <Fragment key={p}>
                              {showEllipsis && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  isActive={p === pagination.page}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPagination(prev => ({ ...prev, page: p }));
                                  }}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </Fragment>
                          );
                        });
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.page < pagination.pages) {
                              setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                            }
                          }}
                          className={pagination.page === pagination.pages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.type || filters.category
                  ? "Try adjusting your filters"
                  : "Start tracking your expenses and income"}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Transaction</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => {
                  setShowAddModal(false);
                  setReceiptImages([]);
                }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import Bills */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Import from bill photos</p>
                    <p className="text-xs text-muted-foreground">Upload one or more images and we’ll auto-create transactions.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportBills}
                    disabled={importingBills || !receiptImages.length}
                  >
                    {importingBills && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Extract & Add
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReceiptImages(Array.from(e.target.files || []))}
                  />
                  {receiptImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {receiptImages.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs"
                        >
                          <span className="max-w-[220px] truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setReceiptImages((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type Toggle */}
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => {
                    setNewTransactionType('expense');
                    setNewTransaction(prev => ({ ...prev, category: 'food' }));
                  }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    newTransactionType === 'expense' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Expense
                </button>
                <button
                  onClick={() => {
                    setNewTransactionType('income');
                    setNewTransaction(prev => ({ ...prev, category: 'allowance' }));
                  }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    newTransactionType === 'income' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Income
                </button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    {(newTransactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <ReactDatePicker
                      selected={newTransaction.date}
                      onChange={(date) => setNewTransaction(prev => ({ ...prev, date }))}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select
                      value={newTransaction.paymentMethod}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Merchant/Store (Optional)</Label>
                  <Input
                    placeholder="e.g., Swiggy, Amazon"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="What was this for?"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-16"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => {
                  setShowAddModal(false);
                  setReceiptImages([]);
                }}>Cancel</Button>
                <Button onClick={handleAddTransaction} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Transaction</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={editingTransaction.category}
                    onChange={(e) => setEditingTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    {(editingTransaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <ReactDatePicker
                      selected={editingTransaction.date}
                      onChange={(date) => setEditingTransaction(prev => ({ ...prev, date }))}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select
                      value={editingTransaction.paymentMethod}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Merchant/Store</Label>
                  <Input
                    value={editingTransaction.merchant || ''}
                    onChange={(e) => setEditingTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingTransaction.description || ''}
                    onChange={(e) => setEditingTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-16"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                <Button onClick={handleUpdateTransaction} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Delete Transaction</CardTitle>
              <CardDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteTransaction(deleteConfirm)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Transactions;
