import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
  Wallet, PiggyBank, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight,
  Target, CheckCircle2, DollarSign, CreditCard, Calendar, ChevronRight,
  Loader2, Receipt, Sparkles, AlertCircle, Clock
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', icon: '🍔' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'subscriptions', label: 'Subscriptions', icon: '📱' },
  { value: 'other_expense', label: 'Other', icon: '📦' }
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: '💼' },
  { value: 'allowance', label: 'Allowance', icon: '💰' },
  { value: 'freelance', label: 'Freelance', icon: '💻' },
  { value: 'scholarship', label: 'Scholarship', icon: '🎓' },
  { value: 'gift', label: 'Gift', icon: '🎁' },
  { value: 'refund', label: 'Refund', icon: '↩️' },
  { value: 'investment_return', label: 'Investment Return', icon: '📈' },
  { value: 'other_income', label: 'Other', icon: '💵' }
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' }
];

const Dashboard = () => {
  const { user, student } = useUser();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [shortTermGoals, setShortTermGoals] = useState([]);
  const [longTermGoals, setLongTermGoals] = useState([]);
  
  // Add transaction form
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date(),
    paymentMethod: 'upi'
  });
  const [savingTransaction, setSavingTransaction] = useState(false);

  const displayName = student?.name || user?.displayName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const [profileRes, statsRes, goalsRes] = await Promise.all([
        axios.get(`${API_URL}/api/student/profile/${user.uid}`),
        axios.get(`${API_URL}/api/transactions/stats/${user.uid}?period=month`),
        axios.get(`${API_URL}/api/student/goals/${user.uid}?includeCompleted=true`)
      ]);

      if (profileRes.data.success) {
        setProfileData(profileRes.data.data.profile);
      }

      if (statsRes.data.success) {
        setTransactionStats(statsRes.data.data.summary);
        setRecentTransactions(statsRes.data.data.recentTransactions || []);
      }

      if (goalsRes.data.success) {
        setShortTermGoals(goalsRes.data.data.shortTermGoals || []);
        setLongTermGoals(goalsRes.data.data.longTermGoals || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || Number(transactionForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSavingTransaction(true);
    try {
      const payload = {
        firebaseUid: user.uid,
        type: transactionType,
        amount: Number(transactionForm.amount),
        category: transactionForm.category,
        description: transactionForm.description,
        date: transactionForm.date,
        paymentMethod: transactionForm.paymentMethod
      };

      const response = await axios.post(`${API_URL}/api/transactions`, payload);

      if (response.data.success) {
        toast.success("Transaction added successfully!");
        setTransactionForm({
          amount: '',
          category: transactionType === 'expense' ? 'food' : 'allowance',
          description: '',
          date: new Date(),
          paymentMethod: 'upi'
        });
        setShowAddTransaction(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setSavingTransaction(false);
    }
  };

  const toggleGoalCompletion = async (type, goalId) => {
    try {
      const response = await axios.post(`${API_URL}/api/student/goals/toggle`, {
        firebaseUid: user.uid,
        goalType: type,
        goalId
      });

      if (response.data.success) {
        const { profile } = response.data.data;
        setShortTermGoals(profile.shortTermGoals || []);
        setLongTermGoals(profile.longTermGoals || []);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling goal:", error);
      toast.error("Failed to update goal");
    }
  };

  // Calculate stats
  const totalExpenses = profileData ? 
    (profileData.rentExpense || 0) + (profileData.foodExpense || 0) + 
    (profileData.transportationExpense || 0) + (profileData.utilitiesExpense || 0) + 
    (profileData.otherExpenses || 0) : 0;

  const budgetUsed = profileData?.monthlyBudget > 0 
    ? Math.min(100, Math.round((totalExpenses / profileData.monthlyBudget) * 100))
    : 0;

  const savingsProgress = profileData?.savingsGoal > 0 
    ? Math.min(100, Math.round((profileData.currentSavings / profileData.savingsGoal) * 100))
    : 0;

  const netBalance = (transactionStats?.totalIncome || 0) - (transactionStats?.totalExpense || 0);

  const activeShortTermGoals = shortTermGoals.filter(g => !g.isCompleted);
  const activeLongTermGoals = longTermGoals.filter(g => !g.isCompleted);

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-background via-primary/5 to-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {displayName}! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's your financial overview for {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/transactions")}>
            <Receipt className="w-4 h-4 mr-2" />
            View History
          </Button>
          <Button onClick={() => setShowAddTransaction(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Income */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{(transactionStats?.totalIncome || profileData?.monthlyIncome || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {profileData?.incomeSource || 'Set up income source'}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{(transactionStats?.totalExpense || totalExpenses || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionStats?.transactionCount || 0} transactions this month
            </p>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}₹{Math.abs(netBalance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? 'You\'re in good shape!' : 'Spending more than earning'}
            </p>
          </CardContent>
        </Card>

        {/* Savings */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{(profileData?.currentSavings || 0).toLocaleString()}
            </div>
            {profileData?.savingsGoal > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>{savingsProgress}% of goal</span>
                  <span>₹{profileData.savingsGoal.toLocaleString()}</span>
                </div>
                <Progress value={savingsProgress} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Quick Add & Budget */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Transaction Form */}
          {showAddTransaction && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Quick Add Transaction
                </CardTitle>
                <CardDescription>Record your income or expense</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transaction Type Toggle */}
                <div className="flex rounded-lg overflow-hidden border">
                  <button
                    onClick={() => {
                      setTransactionType('expense');
                      setTransactionForm(prev => ({ ...prev, category: 'food' }));
                    }}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                      transactionType === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Expense
                  </button>
                  <button
                    onClick={() => {
                      setTransactionType('income');
                      setTransactionForm(prev => ({ ...prev, category: 'allowance' }));
                    }}
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                      transactionType === 'income' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Income
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      {(transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <ReactDatePicker
                      selected={transactionForm.date}
                      onChange={(date) => setTransactionForm(prev => ({ ...prev, date }))}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select
                      value={transactionForm.paymentMethod}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="What was this for?"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-16"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTransaction} disabled={savingTransaction}>
                    {savingTransaction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add {transactionType === 'expense' ? 'Expense' : 'Income'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Budget Overview
              </CardTitle>
              <CardDescription>Your monthly budget utilization</CardDescription>
            </CardHeader>
            <CardContent>
              {profileData?.monthlyBudget > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Budget Used</span>
                      <span className={`text-sm font-bold ${budgetUsed > 80 ? 'text-red-500' : budgetUsed > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {budgetUsed}%
                      </span>
                    </div>
                    <Progress 
                      value={budgetUsed} 
                      className={`h-3 ${budgetUsed > 80 ? '[&>div]:bg-red-500' : budgetUsed > 50 ? '[&>div]:bg-yellow-500' : ''}`}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>₹{totalExpenses.toLocaleString()} spent</span>
                      <span>₹{profileData.monthlyBudget.toLocaleString()} budget</span>
                    </div>
                  </div>
                  
                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food</span>
                        <span>₹{(profileData.foodExpense || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent</span>
                        <span>₹{(profileData.rentExpense || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport</span>
                        <span>₹{(profileData.transportationExpense || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Utilities</span>
                        <span>₹{(profileData.utilitiesExpense || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other</span>
                        <span>₹{(profileData.otherExpenses || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Remaining</span>
                        <span className={profileData.monthlyBudget - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{(profileData.monthlyBudget - totalExpenses).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No budget set yet</p>
                  <Button variant="outline" onClick={() => navigate("/profile")}>
                    Set up Budget
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {tx.category?.replace(/_/g, ' ') || tx.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No transactions recorded yet</p>
                  <Button onClick={() => setShowAddTransaction(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Goals */}
        <div className="space-y-6">
          {/* Short Term Goals */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-amber-500" />
                Short-term Goals
              </CardTitle>
              <CardDescription>
                {activeShortTermGoals.length} active goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeShortTermGoals.length > 0 ? (
                activeShortTermGoals.slice(0, 4).map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <button
                      onClick={() => toggleGoalCompletion('shortTerm', goal.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      {goal.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      {goal.targetAmount > 0 && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>₹{(goal.currentAmount || 0).toLocaleString()}</span>
                            <span>₹{goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100))} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {format(new Date(goal.deadline), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No active short-term goals</p>
                  <Button variant="link" size="sm" onClick={() => navigate("/profile")}>
                    Add Goal
                  </Button>
                </div>
              )}
              {activeShortTermGoals.length > 4 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/profile")}>
                  +{activeShortTermGoals.length - 4} more goals
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Long Term Goals */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Long-term Goals
              </CardTitle>
              <CardDescription>
                {activeLongTermGoals.length} active goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeLongTermGoals.length > 0 ? (
                activeLongTermGoals.slice(0, 3).map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <button
                      onClick={() => toggleGoalCompletion('longTerm', goal.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      {goal.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      {goal.targetAmount > 0 && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>₹{(goal.currentAmount || 0).toLocaleString()}</span>
                            <span>₹{goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100))} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No active long-term goals</p>
                  <Button variant="link" size="sm" onClick={() => navigate("/profile")}>
                    Add Goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Tips */}
          <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                Quick Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {budgetUsed > 80 
                  ? "⚠️ You've used most of your budget. Consider reviewing your spending categories."
                  : savingsProgress < 30
                  ? "💡 Try to save at least 20% of your income. Small amounts add up!"
                  : netBalance < 0
                  ? "📉 You're spending more than you earn. Review your expenses."
                  : "✨ Great job! Keep tracking your expenses to maintain financial health."
                }
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddTransaction(true)} className="h-auto py-3 flex-col gap-1">
                <Plus className="w-4 h-4" />
                <span className="text-xs">Add Transaction</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/transactions")} className="h-auto py-3 flex-col gap-1">
                <Receipt className="w-4 h-4" />
                <span className="text-xs">View History</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="h-auto py-3 flex-col gap-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Edit Goals</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="h-auto py-3 flex-col gap-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Update Budget</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
