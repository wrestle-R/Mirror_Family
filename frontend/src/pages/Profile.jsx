import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import { 
  Loader2, User, Wallet, Target, CheckCircle2, TrendingUp, DollarSign, 
  Briefcase, Save, Plus, Trash2, Calendar, X, ArrowUpRight, Utensils, Car, Film,
  ShoppingBag, Lightbulb, Home, BookOpen, Hospital, ShoppingCart, Smartphone,
  Package, GraduationCap, Gift, Banknote, Laptop, ArrowLeftRight, BarChart3, Plane,
  Dumbbell, Sparkles, Shield
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Savings' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'investment', label: 'Investment' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel' },
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'debt_repayment', label: 'Debt Repayment' },
  { value: 'other', label: 'Other' }
];

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

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' }
];

const Profile = () => {
  const { user, student, syncStudentWithBackend } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [completedGoal, setCompletedGoal] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    amount: '',
    category: 'other_expense',
    description: '',
    date: new Date(),
    paymentMethod: 'upi'
  });
  const [savingTransaction, setSavingTransaction] = useState(false);
  
  // Monthly income recording state
  const [recordingIncome, setRecordingIncome] = useState(false);
  
  // Form data for profile fields
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    dateOfBirth: "",
    education: "",
    parentContact: "",
    monthlyIncome: "",
    incomeSource: "Allowance",
    monthlyBudget: "",
    rentExpense: "",
    foodExpense: "",
    transportationExpense: "",
    utilitiesExpense: "",
    otherExpenses: "",
    currentSavings: "",
    savingsGoal: "",
    investmentsAmount: "",
    investmentType: "None",
    totalDebt: "",
    debtDetails: "",
    debtPaymentMonthly: "",
    financialCondition: "Stable",
    financialLiteracy: "Beginner",
    riskTolerance: "Low",
    preferredCommunication: "Email"
  });

  // Goals state
  const [shortTermGoals, setShortTermGoals] = useState([]);
  const [longTermGoals, setLongTermGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: null,
    priority: "medium",
    category: "savings"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const response = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
          if (response.data.success) {
            const { student: studentData, profile } = response.data.data;
            setFormData({
              name: studentData.name || "",
              contactNumber: studentData.contactNumber || "",
              dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
              education: profile.education || "",
              parentContact: profile.parentContact || "",
              monthlyIncome: profile.monthlyIncome || "",
              incomeSource: profile.incomeSource || "Allowance",
              monthlyBudget: profile.monthlyBudget || "",
              rentExpense: profile.rentExpense || "",
              foodExpense: profile.foodExpense || "",
              transportationExpense: profile.transportationExpense || "",
              utilitiesExpense: profile.utilitiesExpense || "",
              otherExpenses: profile.otherExpenses || "",
              currentSavings: profile.currentSavings || "",
              savingsGoal: profile.savingsGoal || "",
              investmentsAmount: profile.investmentsAmount || "",
              investmentType: profile.investmentType || "None",
              totalDebt: profile.totalDebt || "",
              debtDetails: profile.debtDetails || "",
              debtPaymentMonthly: profile.debtPaymentMonthly || "",
              financialCondition: profile.financialCondition || "Stable",
              financialLiteracy: profile.financialLiteracy || "Beginner",
              riskTolerance: profile.riskTolerance || "Low",
              preferredCommunication: profile.preferredCommunication || "Email"
            });
            setShortTermGoals(profile.shortTermGoals || []);
            setLongTermGoals(profile.longTermGoals || []);
            calculateCompletion(profile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const calculateCompletion = (data) => {
    const fields = [
      formData.name || data?.name, 
      formData.contactNumber || data?.contactNumber, 
      formData.education || data?.education, 
      formData.monthlyIncome || data?.monthlyIncome, 
      formData.monthlyBudget || data?.monthlyBudget, 
      formData.currentSavings || data?.currentSavings,
      (shortTermGoals.length > 0 || data?.shortTermGoals?.length > 0),
      (longTermGoals.length > 0 || data?.longTermGoals?.length > 0)
    ];
    const filled = fields.filter(f => f).length;
    setCompletion(Math.round((filled / fields.length) * 100));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        firebaseUid: user.uid,
        ...formData,
        monthlyIncome: Number(formData.monthlyIncome) || 0,
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        rentExpense: Number(formData.rentExpense) || 0,
        foodExpense: Number(formData.foodExpense) || 0,
        transportationExpense: Number(formData.transportationExpense) || 0,
        utilitiesExpense: Number(formData.utilitiesExpense) || 0,
        otherExpenses: Number(formData.otherExpenses) || 0,
        currentSavings: Number(formData.currentSavings) || 0,
        savingsGoal: Number(formData.savingsGoal) || 0,
        investmentsAmount: Number(formData.investmentsAmount) || 0,
        totalDebt: Number(formData.totalDebt) || 0,
        debtPaymentMonthly: Number(formData.debtPaymentMonthly) || 0,
        shortTermGoals,
        longTermGoals
      };

      const response = await axios.post(`${API_URL}/api/student/profile`, payload);

      if (response.data.success) {
        calculateCompletion(null);
        setLastSaved(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        toast.success("Profile saved successfully!");
        
        if (formData.name !== student?.name) {
          syncStudentWithBackend(user, formData.name);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = async () => {
    await saveProfile();
  };

  // Goal management functions
  const addGoal = async (type) => {
    if (!newGoal.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/student/goals`, {
        firebaseUid: user.uid,
        goalType: type,
        goal: {
          ...newGoal,
          id: `goal_${Date.now()}`,
          targetAmount: Number(newGoal.targetAmount) || 0
        }
      });

      if (response.data.success) {
        const { profile } = response.data.data;
        setShortTermGoals(profile.shortTermGoals || []);
        setLongTermGoals(profile.longTermGoals || []);
        setNewGoal({
          title: "",
          description: "",
          targetAmount: "",
          deadline: null,
          priority: "medium",
          category: "savings"
        });
        toast.success("Goal added successfully!");
      }
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Failed to add goal");
    }
  };

  const toggleGoalCompletion = async (type, goalId) => {
    // Find the goal first to check its current state BEFORE toggling
    const allGoalsBefore = [...shortTermGoals, ...longTermGoals];
    const goalBefore = allGoalsBefore.find(g => g.id === goalId);
    const wasCompletedBefore = goalBefore?.isCompleted;

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
        
        // If goal was NOT completed before and is NOW completed, show transaction modal
        if (!wasCompletedBefore) {
          const allGoalsAfter = [...(profile.shortTermGoals || []), ...(profile.longTermGoals || [])];
          const toggledGoal = allGoalsAfter.find(g => g.id === goalId);
          
          if (toggledGoal && toggledGoal.isCompleted) {
            setCompletedGoal(toggledGoal);
            // Pre-fill transaction form based on goal
            const isIncome = toggledGoal.category === 'investment' || toggledGoal.category === 'savings';
            const suggestedCategory = toggledGoal.category === 'purchase' ? 'shopping' :
                                       toggledGoal.category === 'education' ? 'education' :
                                       toggledGoal.category === 'travel' ? 'travel' :
                                       toggledGoal.category === 'investment' ? 'investment_return' :
                                       toggledGoal.category === 'debt_repayment' ? 'other_expense' :
                                       isIncome ? 'other_income' : 'other_expense';
            
            setTransactionForm({
              type: isIncome ? 'income' : 'expense',
              amount: toggledGoal.targetAmount || toggledGoal.currentAmount || '',
              category: suggestedCategory,
              description: `Goal completed: ${toggledGoal.title}`,
              date: new Date(),
              paymentMethod: 'upi'
            });
            setShowTransactionModal(true);
          }
        }
        
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const deleteGoal = async (type, goalId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/student/goals`, {
        data: { firebaseUid: user.uid, goalType: type, goalId }
      });

      if (response.data.success) {
        const { profile } = response.data.data;
        setShortTermGoals(profile.shortTermGoals || []);
        setLongTermGoals(profile.longTermGoals || []);
        toast.success("Goal deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleSaveTransaction = async () => {
    if (!transactionForm.amount || transactionForm.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSavingTransaction(true);
    try {
      const payload = {
        firebaseUid: user.uid,
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        category: transactionForm.category,
        description: transactionForm.description,
        date: transactionForm.date,
        paymentMethod: transactionForm.paymentMethod
      };

      const response = await axios.post(`${API_URL}/api/transactions`, payload);

      if (response.data.success) {
        toast.success("Transaction added successfully!");
        setShowTransactionModal(false);
        setCompletedGoal(null);
        setTransactionForm({
          type: 'expense',
          amount: '',
          category: 'other_expense',
          description: '',
          date: new Date(),
          paymentMethod: 'upi'
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleRecordMonthlyIncome = async () => {
    if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
      toast.error("Please set your monthly income first");
      return;
    }

    setRecordingIncome(true);
    try {
      const response = await axios.post(`${API_URL}/api/student/record-monthly-income`, {
        firebaseUid: user.uid
      });

      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error recording monthly income:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to record monthly income");
      }
    } finally {
      setRecordingIncome(false);
    }
  };

  const GoalCard = ({ goal, type }) => {
    const progress = goal.targetAmount > 0 
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) 
      : 0;

    return (
      <div className={`p-4 rounded-lg border ${goal.isCompleted ? 'bg-muted/50 opacity-70' : 'bg-card'} transition-all`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => toggleGoalCompletion(type, goal.id)}
              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                goal.isCompleted 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-muted-foreground hover:border-primary'
              }`}
            >
              {goal.isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1">
              <h4 className={`font-medium ${goal.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {goal.title}
              </h4>
              {goal.description && (
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  goal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {goal.priority}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {GOAL_CATEGORIES.find(c => c.value === goal.category)?.label || goal.category}
                </span>
                {goal.deadline && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(goal.deadline), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              {goal.targetAmount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>₹{goal.currentAmount?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">₹{goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => deleteGoal(type, goal.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-full bg-gradient-to-br from-background via-primary/5 to-background min-h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Student Financial Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Build your complete financial profile and track your goals
            </p>
          </div>

          {/* Progress Bar with Last Saved */}
          <Card className="mb-8 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">Profile Completion</h3>
                  <p className="text-sm text-muted-foreground">Auto-saves when you switch tabs</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{completion}%</p>
                    {lastSaved && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Save className="w-3 h-3" /> Saved at {lastSaved}
                      </p>
                    )}
                  </div>
                  {completion === 100 && (
                    <CheckCircle2 className="w-8 h-8 text-green-500 animate-bounce" />
                  )}
                </div>
              </div>
              <Progress value={completion} className="h-3" />
            </CardContent>
          </Card>

          {/* Tabs Navigation */}
          <Tabs defaultValue="personal" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5 mb-8">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Income</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Expenses</span>
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Assets</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Your basic details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <ReactDatePicker
                        selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                        onChange={(date) => handleChange({ target: { name: "dateOfBirth", value: date ? format(date, "yyyy-MM-dd") : "" } })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholderText="DD/MM/YYYY"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <select name="education" value={formData.education} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">Select Education Level</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="B.Tech / BTech">B.Tech / BTech</option>
                      <option value="B.Sc / BSc">B.Sc / BSc</option>
                      <option value="B.Com / BCom">B.Com / BCom</option>
                      <option value="BBA">BBA</option>
                      <option value="M.Tech / MTech">M.Tech / MTech</option>
                      <option value="Masters">Masters</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="parentContact">Parent/Guardian Contact</Label>
                    <Input id="parentContact" name="parentContact" value={formData.parentContact} onChange={handleChange} placeholder="+91 98765 43211" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Income Tab */}
            <TabsContent value="income" className="space-y-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Income Details
                      </CardTitle>
                      <CardDescription>Your monthly income and sources</CardDescription>
                    </div>
                    {formData.monthlyIncome > 0 && (
                      <Button 
                        onClick={handleRecordMonthlyIncome} 
                        disabled={recordingIncome}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {recordingIncome ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Record This Month
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income (₹)</Label>
                    <Input id="monthlyIncome" name="monthlyIncome" type="number" value={formData.monthlyIncome} onChange={handleChange} placeholder="0" />
                    <p className="text-xs text-muted-foreground">Total monthly earnings</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomeSource">Income Source</Label>
                    <select name="incomeSource" value={formData.incomeSource} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Allowance">Allowance</option>
                      <option value="Part-time Job">Part-time Job</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                      <option value="Investment Returns">Investment Returns</option>
                      <option value="Family Support">Family Support</option>
                      <option value="Scholarship">Scholarship</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.monthlyIncome > 0 && (
                    <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300">
                        <strong>Quick Tip:</strong> Click "Record This Month" button above to add your ₹{Number(formData.monthlyIncome).toLocaleString()} {formData.incomeSource} income as a transaction for this month.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-6">
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500" />
                    Monthly Expenses
                  </CardTitle>
                  <CardDescription>Breakdown of your monthly spending</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyBudget">Total Monthly Budget (₹)</Label>
                    <Input id="monthlyBudget" name="monthlyBudget" type="number" value={formData.monthlyBudget} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rentExpense">Rent/Accommodation (₹)</Label>
                    <Input id="rentExpense" name="rentExpense" type="number" value={formData.rentExpense} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foodExpense">Food & Groceries (₹)</Label>
                    <Input id="foodExpense" name="foodExpense" type="number" value={formData.foodExpense} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportationExpense">Transportation (₹)</Label>
                    <Input id="transportationExpense" name="transportationExpense" type="number" value={formData.transportationExpense} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utilitiesExpense">Utilities & Internet (₹)</Label>
                    <Input id="utilitiesExpense" name="utilitiesExpense" type="number" value={formData.utilitiesExpense} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherExpenses">Other Expenses (₹)</Label>
                    <Input id="otherExpenses" name="otherExpenses" type="number" value={formData.otherExpenses} onChange={handleChange} placeholder="0" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets" className="space-y-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Savings & Investments
                  </CardTitle>
                  <CardDescription>Your assets and investment portfolio</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentSavings">Current Savings (₹)</Label>
                    <Input id="currentSavings" name="currentSavings" type="number" value={formData.currentSavings} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsGoal">Savings Goal (₹)</Label>
                    <Input id="savingsGoal" name="savingsGoal" type="number" value={formData.savingsGoal} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investmentsAmount">Investments Amount (₹)</Label>
                    <Input id="investmentsAmount" name="investmentsAmount" type="number" value={formData.investmentsAmount} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investmentType">Investment Types</Label>
                    <select name="investmentType" value={formData.investmentType} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="None">None</option>
                      <option value="Stocks">Stocks</option>
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="Bonds">Bonds</option>
                      <option value="Cryptocurrency">Cryptocurrency</option>
                      <option value="Gold/Silver">Gold/Silver</option>
                      <option value="Fixed Deposits">Fixed Deposits</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Multiple">Multiple</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalDebt">Total Debt (₹)</Label>
                    <Input id="totalDebt" name="totalDebt" type="number" value={formData.totalDebt} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtPaymentMonthly">Monthly Debt Payment (₹)</Label>
                    <Input id="debtPaymentMonthly" name="debtPaymentMonthly" type="number" value={formData.debtPaymentMonthly} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="debtDetails">Debt Details</Label>
                    <Textarea id="debtDetails" name="debtDetails" value={formData.debtDetails} onChange={handleChange} placeholder="e.g., ₹50k Education Loan, ₹10k Credit Card" className="min-h-20" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals Tab - Completely Redesigned */}
            <TabsContent value="goals" className="space-y-6">
              {/* Financial Preferences Card */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-500" />
                    Financial Preferences
                  </CardTitle>
                  <CardDescription>Your financial status and preferences</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="financialCondition">Current Financial Condition</Label>
                    <select name="financialCondition" value={formData.financialCondition} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Stable">Stable</option>
                      <option value="Good">Good</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financialLiteracy">Financial Literacy Level</Label>
                    <select name="financialLiteracy" value={formData.financialLiteracy} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Low">Low (Conservative)</option>
                      <option value="Medium">Medium (Balanced)</option>
                      <option value="High">High (Aggressive)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredCommunication">Preferred Communication</Label>
                    <select name="preferredCommunication" value={formData.preferredCommunication} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="Push Notifications">Push Notifications</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Add New Goal Card */}
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-500" />
                    Add New Goal
                  </CardTitle>
                  <CardDescription>Create a new financial goal to track</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Goal Title *</Label>
                      <Input 
                        value={newGoal.title} 
                        onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Save for new laptop"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Amount (₹)</Label>
                      <Input 
                        type="number"
                        value={newGoal.targetAmount} 
                        onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <select 
                        value={newGoal.category} 
                        onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      >
                        {GOAL_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <select 
                        value={newGoal.priority} 
                        onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline (Optional)</Label>
                      <ReactDatePicker
                        selected={newGoal.deadline}
                        onChange={(date) => setNewGoal(prev => ({ ...prev, deadline: date }))}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                        placeholderText="Select deadline"
                        minDate={new Date()}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description (Optional)</Label>
                      <Textarea 
                        value={newGoal.description} 
                        onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your goal..."
                        className="min-h-16"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => addGoal('shortTerm')} variant="default">
                      <Plus className="w-4 h-4 mr-2" />
                      Add as Short-term Goal
                    </Button>
                    <Button onClick={() => addGoal('longTerm')} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add as Long-term Goal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Short Term Goals */}
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Short-term Goals (0-1 year)
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                      {shortTermGoals.filter(g => g.isCompleted).length}/{shortTermGoals.length} completed
                    </span>
                  </CardTitle>
                  <CardDescription>Quick wins and immediate targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shortTermGoals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No short-term goals yet. Add one above!</p>
                  ) : (
                    <>
                      {shortTermGoals.filter(g => !g.isCompleted).map(goal => (
                        <GoalCard key={goal.id} goal={goal} type="shortTerm" />
                      ))}
                      {shortTermGoals.some(g => g.isCompleted) && (
                        <>
                          <Separator className="my-4" />
                          <p className="text-sm text-muted-foreground">Completed Goals</p>
                          {shortTermGoals.filter(g => g.isCompleted).map(goal => (
                            <GoalCard key={goal.id} goal={goal} type="shortTerm" />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Long Term Goals */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Long-term Goals (1-5 years)
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                      {longTermGoals.filter(g => g.isCompleted).length}/{longTermGoals.length} completed
                    </span>
                  </CardTitle>
                  <CardDescription>Major milestones and future aspirations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {longTermGoals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No long-term goals yet. Add one above!</p>
                  ) : (
                    <>
                      {longTermGoals.filter(g => !g.isCompleted).map(goal => (
                        <GoalCard key={goal.id} goal={goal} type="longTerm" />
                      ))}
                      {longTermGoals.some(g => g.isCompleted) && (
                        <>
                          <Separator className="my-4" />
                          <p className="text-sm text-muted-foreground">Completed Goals</p>
                          {longTermGoals.filter(g => g.isCompleted).map(goal => (
                            <GoalCard key={goal.id} goal={goal} type="longTerm" />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Manual Save Button */}
          <div className="flex justify-end gap-3 mt-8 sticky bottom-6 z-10">
            <Button onClick={saveProfile} size="lg" disabled={saving} className="min-w-[200px] shadow-lg hover:shadow-xl">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && completedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="relative">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setCompletedGoal(null);
                }}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Goal Completed!
              </CardTitle>
              <CardDescription>
                Record a transaction for: <strong>{completedGoal.title}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Type Toggle */}
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setTransactionForm(prev => ({ ...prev, type: 'expense', category: 'other_expense' }))}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    transactionForm.type === 'expense' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Expense
                </button>
                <button
                  onClick={() => setTransactionForm(prev => ({ ...prev, type: 'income', category: 'other_income' }))}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    transactionForm.type === 'income' 
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
                    {(transactionForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What was this for?"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTransactionModal(false);
                    setCompletedGoal(null);
                  }}
                >
                  Skip
                </Button>
                <Button onClick={handleSaveTransaction} disabled={savingTransaction}>
                  {savingTransaction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default Profile;
