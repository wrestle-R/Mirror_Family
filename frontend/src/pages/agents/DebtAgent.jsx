import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    CheckCircle2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/UserContext";
import { calculateDebtPayoff } from "@/utils/simulationUtils";
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
                Month {month}: ₹{remaining.toLocaleString()}
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

    // AI State
    const [aiData, setAiData] = useState(null);
    const [generatingAI, setGeneratingAI] = useState(false);

    // 1. Fetch Debts & AI Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Profile for real debt numbers
                const profileRes = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
                const p = profileRes.data?.data?.profile;

                if (p && p.totalDebt > 0) {
                    setDebts([{
                        id: 1,
                        name: "Total Consolidated Debt",
                        balance: p.totalDebt,
                        rate: 0.12, // User needs to input this ideally, assuming average 12%
                        minPayment: p.debtPaymentMonthly || (p.totalDebt * 0.02)
                    }]);
                } else {
                    setDebts([]); // No debt found
                }

                // Fetch Existing AI Analysis
                try {
                    const aiRes = await axios.get(`${API_URL}/api/agents/debt/${user.uid}`);
                    if (aiRes.data && aiRes.data.data) {
                        setAiData(aiRes.data.data);
                    }
                } catch (e) {
                    console.log("No existing debt AI analysis.");
                }

            } catch (err) {
                console.error(err);
                toast.error("Failed to load debt profile");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // 2. Run Simulation
    useEffect(() => {
        if (debts.length === 0) return;

        // Active Scenario
        const result = calculateDebtPayoff(debts, extraPayment, strategy);

        // Baseline (Minimums Only)
        const baseline = calculateDebtPayoff(debts, 0, strategy);

        setSimResult({
            ...result,
            originalMonthsToPayoff: baseline.monthsToPayoff,
            originalTotalInterest: baseline.totalInterestPaid
        });
    }, [debts, extraPayment, strategy]);

    // 3. Generate AI
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

    // --- Empty State: DEBT FREE ---
    if (debts.length === 0) {
        return (
            <div className="h-full w-full p-8 flex flex-col justify-center items-center text-center max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
                    <PartyPopper className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">You are Debt Free!</h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                    Based on your profile, you have no outstanding debt. This is a fantastic financial position to be in.
                </p>
                <div className="flex gap-4">
                    <Link to="/agents/investment">
                        <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                            <TrendingDown className="w-4 h-4 rotate-180" />
                            Start Investing
                        </Button>
                    </Link>
                    <Link to="/profile">
                        <Button variant="outline" size="lg">Update Profile</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);

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
                <Button
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    variant="destructive"
                    className="shadow-lg shadow-red-500/20 gap-2"
                >
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    {aiData ? "Refresh Analysis" : "Analyze My Debt"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Left Col: Strategy & Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Controls */}
                    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-muted-foreground" />
                                Power-Up Payments
                            </CardTitle>
                            <CardDescription>Extra payments dramatically cut interest.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Monthly Extra</span>
                                    <Badge variant="destructive" className="font-mono text-base">+ ₹{extraPayment.toLocaleString()}</Badge>
                                </div>
                                <Slider
                                    value={[extraPayment]}
                                    max={Math.max(20000, totalMinPayment)}
                                    step={500}
                                    onValueChange={(v) => setExtraPayment(v[0])}
                                    className="py-2 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    <span>₹0</span>
                                    <span>₹{Math.max(20000, totalMinPayment).toLocaleString()}</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="p-4 bg-muted/40 rounded-lg border flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Total Monthly Pay</span>
                                    <span className="font-bold text-lg text-foreground">₹{(totalMinPayment + extraPayment).toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                    {/* Simple progress bar visual */}
                                    <div className="h-full bg-red-500 w-full animate-pulse-slow"></div>
                                </div>
                                <div className="text-[10px] text-muted-foreground text-center">
                                    Includes ₹{totalMinPayment.toLocaleString()} minimums
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

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 ring-1 ring-green-100 dark:ring-green-900/40">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Total Interest</div>
                                <div className="text-2xl font-black text-green-800 dark:text-green-300">
                                    ₹{simResult?.totalInterestPaid.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-green-600 mt-1">
                                    Lifetime cost
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Debt Free In</div>
                                <div className="text-2xl font-black text-foreground">
                                    {Math.ceil(simResult?.monthsToPayoff / 12)} <span className="text-lg">Years</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                    {new Date().getFullYear() + Math.floor(simResult?.monthsToPayoff / 12)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Time Saved</div>
                                <div className="text-2xl font-black text-foreground">
                                    {Math.floor((simResult?.originalMonthsToPayoff - simResult?.monthsToPayoff) / 12)}y <span className="text-lg">{(simResult?.originalMonthsToPayoff - simResult?.monthsToPayoff) % 12}m</span>
                                </div>
                                <div className="text-[10px] text-green-600 font-bold mt-1">
                                    vs Minimum Payment
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
                            <p className="text-[10px] text-muted-foreground">Paying extra accelerates this slope.</p>
                        </div>

                        <div className="absolute inset-0 pt-20 pb-4 px-6 overflow-x-auto flex items-end gap-1 md:gap-2 no-scrollbar">
                            {simResult && simResult.history.filter((_, i) => i % 2 === 0).map((point, i) => ( // Sample more frequently (every 2)
                                <TimelineBar
                                    key={i}
                                    month={point.month}
                                    remaining={point.remainingDebt}
                                    total={point.remainingDebt + point.totalInterest}
                                    maxDebt={totalDebt * 1.5} // Scaling factor
                                />
                            ))}
                            {/* Success Flag */}
                            <div className="h-[200px] flex flex-col justify-end ml-8 items-center animate-bounce duration-1000">
                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg mb-2 whitespace-nowrap">
                                    FREEDOM!
                                </div>
                                <div className="w-0.5 h-full bg-green-500/50 dashed border-l-2 border-green-500 border-dashed"></div>
                            </div>
                        </div>
                    </Card>

                    {/* AI Insight Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* AI Generic Insights */}
                        <Card className="md:col-span-2 border-none shadow-md bg-card overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3 border-b">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    Smart Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {aiData ? (
                                    <div className="p-4 space-y-4">
                                        <p className="text-sm text-foreground/90 leading-relaxed">
                                            {aiData.summary}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {aiData.tips?.slice(0, 4).map((tip, i) => (
                                                <div key={i} className="flex gap-2 text-xs bg-muted/30 p-2 rounded border">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-muted-foreground">{tip}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Simulator Logic Blurb */}
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                                            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <div>
                                                By paying <strong>₹{extraPayment.toLocaleString()} extra</strong> monthly using the <strong>{strategy}</strong> method, you could save <strong>₹{(simResult?.originalTotalInterest - simResult?.totalInterestPaid).toLocaleString()}</strong> in interest compared to minimum payments.
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                                        <div className="p-3 bg-muted rounded-full">
                                            <BrainCircuit className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Unlock debt payoff strategies</p>
                                            <p className="text-xs text-muted-foreground">Click 'Analyze My Debt' above to get personalized advice.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
