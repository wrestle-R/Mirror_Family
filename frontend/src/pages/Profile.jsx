import { useEffect, useState } from "react";
import { Layout } from "@/components/Dashboard/Layout";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, User, Wallet, Target, CheckCircle2, TrendingUp, DollarSign, Briefcase, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Profile = () => {
  const { user, student, syncStudentWithBackend } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
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
    shortTermGoals: "",
    longTermGoals: "",
    financialCondition: "Stable",
    financialLiteracy: "Beginner",
    riskTolerance: "Low",
    preferredCommunication: "Email"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const response = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
          if (response.data.success) {
            const { student, profile } = response.data.data;
            setFormData({
              name: student.name || "",
              contactNumber: student.contactNumber || "",
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
              shortTermGoals: profile.shortTermGoals || "",
              longTermGoals: profile.longTermGoals || "",
              financialCondition: profile.financialCondition || "Stable",
              financialLiteracy: profile.financialLiteracy || "Beginner",
              riskTolerance: profile.riskTolerance || "Low",
              preferredCommunication: profile.preferredCommunication || "Email"
            });
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
      data.name, data.contactNumber, data.education, data.monthlyIncome, 
      data.monthlyBudget, data.currentSavings, data.shortTermGoals, data.longTermGoals
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
        monthlyIncome: Number(formData.monthlyIncome),
        monthlyBudget: Number(formData.monthlyBudget),
        rentExpense: Number(formData.rentExpense),
        foodExpense: Number(formData.foodExpense),
        transportationExpense: Number(formData.transportationExpense),
        utilitiesExpense: Number(formData.utilitiesExpense),
        otherExpenses: Number(formData.otherExpenses),
        currentSavings: Number(formData.currentSavings),
        savingsGoal: Number(formData.savingsGoal),
        investmentsAmount: Number(formData.investmentsAmount),
        totalDebt: Number(formData.totalDebt),
        debtPaymentMonthly: Number(formData.debtPaymentMonthly)
      };

      const response = await axios.post(`${API_URL}/api/student/profile`, payload);

      if (response.data.success) {
        const fields = [
          formData.name, formData.contactNumber, formData.education, formData.monthlyIncome, 
          formData.monthlyBudget, formData.currentSavings, formData.shortTermGoals, formData.longTermGoals
        ];
        const filled = fields.filter(f => f).length;
        const newCompletion = Math.round((filled / fields.length) * 100);
        setCompletion(newCompletion);
        setLastSaved(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        
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

  const handleTabChange = async (value) => {
    await saveProfile();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-full bg-gradient-to-br from-background via-primary/5 to-background min-h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Student Financial Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Build your complete financial profile and get personalized recommendations
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
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
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
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Income Details
                  </CardTitle>
                  <CardDescription>Your monthly income and sources</CardDescription>
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

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Financial Goals & Preferences
                  </CardTitle>
                  <CardDescription>Your aspirations and financial preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
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
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="shortTermGoals">Short Term Goals (0-1 year)</Label>
                    <Textarea id="shortTermGoals" name="shortTermGoals" value={formData.shortTermGoals} onChange={handleChange} placeholder="e.g., Save ₹10,000 for new laptop, Pay off credit card debt" className="min-h-24" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longTermGoals">Long Term Goals (1-5 years)</Label>
                    <Textarea id="longTermGoals" name="longTermGoals" value={formData.longTermGoals} onChange={handleChange} placeholder="e.g., Build emergency fund, Start investing in stocks, Save for higher studies" className="min-h-24" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Manual Save Button */}
          <div className="flex justify-end gap-3 mt-8 sticky bottom-6 z-10">
            <Button onClick={saveProfile} size="lg" disabled={saving} className="min-w-[200px] shadow-lg hover:shadow-xl">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile "}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
