import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    TrendingDown,
    Banknote,
    AlertTriangle,
    Loader2,
    Sparkles,
    BrainCircuit,
    Lightbulb,
    Target,
    PartyPopper,
    CheckCircle2,
    Plus,
    Trash2,
    Pencil,
    X,
    Save,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { calculateDebtPayoff } from "@/utils/simulationUtils";
import { Money } from "@/components/ui/money";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Components ---

const StrategyCard = ({ title, description, isActive, onClick, icon: Icon }) => (
    <div
        onClick={onClick}
        className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isActive ? 'border-primary ring-1 ring-primary/20 bg-primary/5 shadow-md' : 'border-border bg-card hover:bg-muted/50'}`}
    >
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {isActive && (
            <div className="absolute top-2 right-2">
                <Badge variant="default" className="text-[10px] h-5 px-1.5">Active</Badge>
            </div>
        )}
    </div>
);

const TimelineBar = ({ month, remaining, total, maxDebt }) => {
    const heightPercent = maxDebt > 0 ? (remaining / maxDebt) * 100 : 0;

    return (
        <div className="flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border shadow-sm whitespace-nowrap z-10 pointer-events-none">
                Month {month}: <Money>₹{remaining.toLocaleString()}</Money>
            </div>

            <div className="w-3 md:w-5 bg-muted/30 rounded-t-sm relative flex items-end overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/5" style={{ height: '200px' }}>
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className="w-full bg-linear-to-t from-red-500 to-orange-400 opacity-80"
                />
            </div>
            {(month % 12 === 0 || month === 1) && (
                <span className="text-[10px] text-muted-foreground font-mono">{Math.floor(month / 12)}y</span>
            )}
        </div>
    );
};

export default function DebtAgent() {
    const { user } = useUser();
    const [debts, setDebts] = useState([]);
    const [extraPayment, setExtraPayment] = useState(0);
    const [strategy, setStrategy] = useState('avalanche'); // avalanche | snowball
    const [loading, setLoading] = useState(true);
    const [simResult, setSimResult] = useState(null);

    // Debt Form State
    const [isAddingDebt, setIsAddingDebt] = useState(false);
    const [newDebt, setNewDebt] = useState({
        name: '',
        balance: '',
        interestRate: '12',
        minPayment: '',
        category: 'other'
    });
    const [savingDebt, setSavingDebt] = useState(false);

    // AI State
    const [aiData, setAiData] = useState(null);
    const [generatingAI, setGeneratingAI] = useState(false);

    // 1. Fetch Debts & AI Data
    const fetchDebts = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${API_URL}/api/student/debts/${user.uid}`);
            if (res.data && res.data.success) {
                const formattedDebts = res.data.data.debts.map(d => ({
                    ...d,
                    rate: d.interestRate / 100 // Convert for simulation
                }));
                setDebts(formattedDebts);
            }
        } catch (err) {
            console.error("Error fetching debts:", err);
            // Fallback for mock if totally empty/error
            setDebts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAIData = async () => {
        if (!user) return;
        try {
            const aiRes = await axios.get(`${API_URL}/api/agents/debt/${user.uid}`);
            if (aiRes.data && aiRes.data.data) {
                setAiData(aiRes.data.data);
            }
        } catch (e) {
            console.log("No existing debt AI analysis.");
        }
    };

    useEffect(() => {
        if (user) {
            fetchDebts();
            fetchAIData();
        }
    }, [user]);

    // 2. Run Simulation
    useEffect(() => {
        if (debts.length === 0) {
            setSimResult(null);
            return;
        }

        // Active Scenario
        const result = calculateDebtPayoff(debts, extraPayment, strategy);

        // Baseline (Minimums Only)
        const baseline = calculateDebtPayoff(debts, 0, strategy);

        setSimResult({
            ...result,
            originalMonthsToPayoff: Math.max(result.monthsToPayoff, baseline.monthsToPayoff),
            originalTotalInterest: Math.max(result.totalInterestPaid, baseline.totalInterestPaid)
        });
    }, [debts, extraPayment, strategy]);

    // 3. Handlers
    const handleAddDebt = async () => {
        if (!user) return;
        if (!newDebt.name || !newDebt.balance || !newDebt.minPayment) {
            toast.error("Please fill all required fields");
            return;
        }

        setSavingDebt(true);
        try {
            const res = await axios.post(`${API_URL}/api/student/debts`, {
                firebaseUid: user.uid,
                debt: {
                    ...newDebt,
                    balance: Number(newDebt.balance),
                    interestRate: Number(newDebt.interestRate),
                    minPayment: Number(newDebt.minPayment)
                }
            });

            if (res.data.success) {
                toast.success("Debt added successfully!");
                setIsAddingDebt(false);
                setNewDebt({ name: '', balance: '', interestRate: '12', minPayment: '', category: 'other' });
                fetchDebts();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to add debt");
        } finally {
            setSavingDebt(false);
        }
    };

    const handleDeleteDebt = async (debtId) => {
        if (!user) return;
        try {
            const res = await axios.delete(`${API_URL}/api/student/debts`, {
                data: { firebaseUid: user.uid, debtId }
            });
            if (res.data.success) {
                toast.success("Debt deleted");
                fetchDebts();
            }
        } catch (err) {
            toast.error("Failed to delete debt");
        }
    };

    const handleGenerateAI = async () => {
        if (!user) return;
        setGeneratingAI(true);
        try {
            const res = await axios.post(`${API_URL}/api/agents/generate`, { type: 'debt', firebaseUid: user.uid });
            setAiData(res.data.data);
            toast.success("Debt Strategy Generated!");
        } catch (error) {
            console.error("Error generating analysis", error);
            toast.error("Failed to generate analysis.");
        } finally {
            setGeneratingAI(false);
        }
    };


    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + (d.minPayment || 0), 0);

    return (
        <div className="min-h-screen w-full p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        Debt Crusher
                    </h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        Strategize your way to financial freedom using math & AI.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddingDebt(!isAddingDebt)}
                        className="gap-2"
                    >
                        {isAddingDebt ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isAddingDebt ? "Cancel" : "Add New Debt"}
                    </Button>
                    <Button
                        onClick={handleGenerateAI}
                        disabled={generatingAI || debts.length === 0}
                        variant="destructive"
                        className="shadow-lg shadow-red-500/20 gap-2"
                    >
                        {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {aiData ? "Refresh Analysis" : "Analyze My Debt"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Left Col: Debt Management & Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Add Debt Form (Conditional) */}
                    <AnimatePresence>
                        {isAddingDebt && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Card className="border-primary/50 shadow-lg bg-primary/5">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Manage Debt Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1 col-span-2">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Debt Name</label>
                                                <Input
                                                    placeholder="e.g. Credit Card, Student Loan"
                                                    value={newDebt.name}
                                                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Balance (₹)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="50000"
                                                    value={newDebt.balance}
                                                    onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Interest Rate (%)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="12"
                                                    value={newDebt.interestRate}
                                                    onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Min Payment (₹)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="2000"
                                                    value={newDebt.minPayment}
                                                    onChange={(e) => setNewDebt({ ...newDebt, minPayment: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                                                <Select
                                                    value={newDebt.category}
                                                    onValueChange={(v) => setNewDebt({ ...newDebt, category: v })}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                                        <SelectItem value="student_loan">Student Loan</SelectItem>
                                                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                                                        <SelectItem value="car_loan">Car Loan</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full h-8 text-xs gap-2"
                                            onClick={handleAddDebt}
                                            disabled={savingDebt}
                                        >
                                            {savingDebt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            Save Debt
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Debts List */}
                    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-3 px-4">
                            <CardTitle className="text-sm flex justify-between items-center">
                                <span>Your Debts</span>
                                <Badge variant="outline" className="font-mono">{debts.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            <ScrollArea className={`${debts.length > 3 ? 'h-64' : 'h-auto'} pr-3`}>
                                {debts.length === 0 ? (
                                    <div className="text-center py-8 opacity-50 flex flex-col items-center gap-2">
                                        <ShieldCheck className="w-8 h-8" />
                                        <p className="text-xs">No debts added yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {debts.map((debt) => (
                                            <div key={debt.id} className="p-3 rounded-lg border bg-background/50 group relative">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm truncate pr-8">{debt.name}</h4>
                                                    <button
                                                        onClick={() => handleDeleteDebt(debt.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                    <span><Money>₹{debt.balance?.toLocaleString()}</Money></span>
                                                    <span className="text-red-500">{(debt.rate * 100).toFixed(1)}% APR</span>
                                                </div>
                                                <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-400" style={{ width: `${Math.min(100, (debt.balance / totalDebt) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>


                    {/* Controls */}
                    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-muted-foreground" />
                                Power-Up Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium uppercase">Monthly Extra</span>
                                    <Badge variant="destructive" className="font-mono">+ <Money>₹{extraPayment.toLocaleString()}</Money></Badge>
                                </div>
                                <Slider
                                    value={[extraPayment]}
                                    max={Math.max(50000, totalMinPayment * 2)}
                                    step={500}
                                    onValueChange={(v) => setExtraPayment(v[0])}
                                    className="py-2 cursor-pointer"
                                    disabled={debts.length === 0}
                                />
                            </div>

                            <Separator />

                            <div className="p-4 bg-muted/40 rounded-lg border flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Total Monthly Pay</span>
                                    <span className="font-bold text-lg text-foreground"><Money>₹{(totalMinPayment + extraPayment).toLocaleString()}</Money></span>
                                </div>
                                <div className="text-[10px] text-muted-foreground text-center">
                                    Includes <Money>₹{totalMinPayment.toLocaleString()}</Money> minimums
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strategy Selection */}
                    <div className="grid grid-cols-1 gap-4">
                        <StrategyCard
                            title="Avalanche Method"
                            description="Highest interest first. Mathematically optimal."
                            isActive={strategy === 'avalanche'}
                            onClick={() => setStrategy('avalanche')}
                            icon={TrendingDown}
                        />
                        <StrategyCard
                            title="Snowball Method"
                            description="Smallest balance first. Psychologically rewarding."
                            isActive={strategy === 'snowball'}
                            onClick={() => setStrategy('snowball')}
                            icon={ShieldCheck}
                        />
                    </div>
                </div>

                {/* Right Col: Timeline & AI Insights */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {debts.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-6 bg-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/20">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <PartyPopper className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">No Debt Detected</h2>
                                <p className="text-muted-foreground mt-2 max-w-sm">
                                    Add your loans, credit cards or other debts to start visualizing your path to freedom.
                                </p>
                            </div>
                            <Button onClick={() => setIsAddingDebt(true)} variant="secondary">Add First Debt</Button>
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-none shadow-sm bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 ring-1 ring-green-100 dark:ring-green-900/40">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-1">Total Interest</div>
                                        <div className="text-2xl font-black text-green-800 dark:text-green-300">
                                            <Money>₹{simResult?.totalInterestPaid.toLocaleString()}</Money>
                                        </div>
                                        <div className="text-[10px] text-green-600 mt-1 font-medium italic">
                                            Simulation Target
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-card">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Freedom Date</div>
                                        <div className="text-2xl font-black text-foreground">
                                            {simResult?.monthsToPayoff >= 12 ? (
                                                <>{Math.floor(simResult?.monthsToPayoff / 12)}y {simResult?.monthsToPayoff % 12}m</>
                                            ) : (
                                                <>{simResult?.monthsToPayoff} months</>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            In {new Date().getFullYear() + Math.floor((new Date().getMonth() + simResult?.monthsToPayoff) / 12)}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-card">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Money Saved</div>
                                        <div className="text-2xl font-black text-green-600">
                                            <Money>₹{(simResult?.originalTotalInterest - simResult?.totalInterestPaid).toLocaleString()}</Money>
                                        </div>
                                        <div className="text-[10px] text-green-600 font-bold mt-1">
                                            with extra payments
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Interactive Timeline */}
                            <Card className="flex-1 min-h-[350px] border-none shadow-inner bg-muted/20 relative overflow-hidden ring-1 ring-border/10 rounded-xl">
                                <div className="absolute top-4 left-6 z-10 bg-background/60 backdrop-blur px-3 py-2 rounded-lg border shadow-sm">
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-primary" />
                                        Balance Glideslope
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">Extra payments accelerate this curve.</p>
                                </div>

                                <div className="absolute inset-0 pt-20 pb-4 px-6 overflow-x-auto flex items-end gap-1 md:gap-2 no-scrollbar">
                                    {simResult && simResult.history.filter((_, i) => i % (Math.max(1, Math.floor(simResult.monthsToPayoff / 40))) === 0).map((point, i) => (
                                        <TimelineBar
                                            key={i}
                                            month={point.month}
                                            remaining={point.remainingDebt}
                                            total={point.remainingDebt + point.totalInterest}
                                            maxDebt={totalDebt}
                                        />
                                    ))}
                                    {/* Success Flag */}
                                    <div className="h-[200px] flex flex-col justify-end ml-4 items-center animate-bounce-slow">
                                        <div className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg mb-2 whitespace-nowrap">
                                            DEBT FREE
                                        </div>
                                        <div className="w-0.5 h-full bg-green-500/50 dashed border-l-2 border-green-500 border-dashed"></div>
                                    </div>
                                </div>
                            </Card>

                            {/* AI Insight Section */}
                            <Card className="border-none shadow-md bg-card overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-3 border-b">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        Strategic Intelligence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pb-6">
                                    {aiData ? (
                                        <div className="p-6 space-y-6">
                                            <div className="flex gap-4">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg h-fit">
                                                    <BrainCircuit className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Summary</h4>
                                                    <p className="text-sm text-foreground/90 leading-relaxed font-inter">
                                                        {aiData.summary}
                                                    </p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payoff Blueprint</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {aiData.tips?.map((tip, i) => (
                                                        <div key={i} className="flex gap-3 text-xs bg-muted/20 p-3 rounded-xl border border-border/50 transition-all hover:bg-muted/40">
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                                                                {i + 1}
                                                            </div>
                                                            <span className="text-muted-foreground/90 leading-snug">{tip}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Impact Blurb */}
                                            <motion.div
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="p-4 bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/50 dark:border-blue-800/50 text-xs flex gap-4 items-center"
                                            >
                                                <div className="w-10 h-10 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-sm">
                                                    <Target className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">Optimization Impact</p>
                                                    <p className="text-muted-foreground mt-0.5">
                                                        The {strategy} method with <Money>₹{extraPayment.toLocaleString()}</Money> extra saves you <span className="text-green-600 font-bold"><Money>₹{(simResult?.originalTotalInterest - simResult?.totalInterestPaid).toLocaleString()}</Money></span> and <span className="text-green-600 font-bold">{simResult?.originalMonthsToPayoff - simResult?.monthsToPayoff} months</span>.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-full border">
                                                <Lightbulb className="w-8 h-8 text-yellow-500" />
                                            </div>
                                            <div className="max-w-xs">
                                                <h3 className="font-bold">Generate Your Blueprint</h3>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Our AI can analyze your specific debts and suggest a mathematically optimized path out of debt.
                                                </p>
                                            </div>
                                            <Button onClick={handleGenerateAI} disabled={generatingAI} size="sm">
                                                {generatingAI ? "Calculating..." : "Analyze Now"}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
