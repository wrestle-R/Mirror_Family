import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Loader2, RefreshCw, Wallet, TrendingDown, TrendingUp, Target, BarChart3, ArrowRight, Zap, Info, CheckCircle2, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Money } from "@/components/ui/money";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const BudgetAgent = () => {
    const type = "budget";
    const { user } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [profile, setProfile] = useState(null);

    const info = {
        title: "Budget Agent",
        icon: Wallet,
        color: "#3b82f6",
        description: "Optimize your spending and save more."
    };

    useEffect(() => {
        if (!user) return;
        axios.get(`${API_URL}/api/student/profile/${user.uid}`)
            .then(res => {
                if (res.data?.data?.profile) setProfile(res.data.data.profile);
            })
            .catch(err => console.error("Error fetching profile", err));
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        if (customElements.get('elevenlabs-convai')) return;
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/agents/${type}/${user.uid}`);
            if (res.data && res.data.data) setData(res.data.data);
            else setData(null);
        } catch (error) {
            console.error("Error fetching agent data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/api/agents/generate`, { type, firebaseUid: user.uid });
            setData(res.data.data);
            toast.success("Analysis generated successfully!");
        } catch (error) {
            console.error("Error generating analysis", error);
            toast.error("Failed to generate analysis.");
        } finally {
            setGenerating(false);
        }
    };

    const renderChart = () => {
        if (!data?.chartData || data.chartData.length === 0) return null;
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

        return (
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const convaiVariables = {
        user_name: user?.displayName || profile?.name || "User",
        email: user?.email || "",
        agent_type: type,
        monthly_income: profile?.monthlyIncome || 0,
        monthly_budget: profile?.monthlyBudget || 0,
        current_savings: profile?.currentSavings || 0,
        savings_goal: profile?.savingsGoal || 0,
        total_debt: profile?.totalDebt || 0,
        debt_payment_monthly: profile?.debtPaymentMonthly || 0,
        investments_amount: profile?.investmentsAmount || 0,
        investment_type: profile?.investmentType || "none",
        financial_literacy: profile?.financialLiteracy || "Beginner",
        risk_tolerance: profile?.riskTolerance || "Low",
        short_term_goals_count: profile?.shortTermGoals?.length || 0,
        long_term_goals_count: profile?.longTermGoals?.length || 0,
        has_analysis: data ? "yes" : "no",
        recommendation_count: data?.recommendations?.length || 0,
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen w-full p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <info.icon className="w-8 h-8 text-primary" style={{ color: info.color }} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{info.title}</h1>
                        <p className="text-muted-foreground">{info.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {data && <div className="text-xs text-muted-foreground hidden md:block">Last updated: {new Date(data.lastUpdated).toLocaleDateString()}</div>}
                    <Button onClick={handleGenerate} disabled={generating} size="lg" className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {data ? "Regenerate Analysis" : "Generate Analysis"}
                    </Button>
                </div>
            </motion.div>

            {/* <elevenlabs-convai agent-id="agent_7101kg2q76p1ewz9x195s6yt4twz" dynamic-variables={JSON.stringify(convaiVariables)} /> */}

            {!data ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                <BarChart3 className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Analysis Generated Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">Get personalized AI insights for your budget specifically tailored to your financial profile.</p>
                            <Button onClick={handleGenerate} disabled={generating}>Start AI Analysis</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <div className="grid gap-6 md:grid-cols-12">
                    <motion.div className="col-span-12 md:col-span-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="shadow-sm border-primary/10 h-full">
                            <CardHeader>
                                <CardTitle>Spending Breakdown</CardTitle>
                                <CardDescription>Visual analysis of your expense distribution</CardDescription>
                            </CardHeader>
                            <CardContent>{renderChart()}</CardContent>
                        </Card>
                    </motion.div>

                    <motion.div className="col-span-12 md:col-span-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="shadow-sm h-full border-l-4 border-l-blue-500">
                            <CardHeader className="bg-primary/5 border-b">
                                <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Quick Actions</CardTitle>
                                <CardDescription>Immediate steps to take</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-4">
                                    {(data.tips || []).slice(0, 4).map((tip, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (i * 0.1) }}
                                            className="flex gap-3 items-start"
                                        >
                                            <div className="mt-0.5 min-w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                                            <span className="text-sm font-medium leading-relaxed">{tip}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* NEW: High Impact Recommendations Section */}
                    {data.recommendations && data.recommendations.length > 0 && (
                        <div className="col-span-12 flex flex-col gap-4 mt-2">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="col-span-full"
                            >
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Zap className="text-yellow-500 fill-yellow-500 w-6 h-6" /> High Impact Optimize Opportunities
                                </h3>
                                <p className="text-muted-foreground text-sm">Top categories where simple changes can unlock significant savings tailored to your goals.</p>
                            </motion.div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {data.recommendations.map((rec, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + (i * 0.1) }}
                                    >
                                        <Card className="h-full border-t-4 border-t-green-500 shadow-md hover:shadow-xl transition-all duration-300 group">
                                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                                <div className="flex justify-between items-start gap-2">
                                                    <CardTitle className="text-lg">{rec.category}</CardTitle>
                                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-200 dark:border-green-800 whitespace-nowrap flex items-center gap-1">
                                                        <TrendingDown size={12} /> Save <Money>₹{rec.potentialSavings?.toLocaleString()}</Money>
                                                    </span>
                                                </div>
                                                <CardDescription className="text-xs font-medium text-orange-600/90 dark:text-orange-400">{rec.benchmark}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-4">
                                                <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 p-2 rounded-lg">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current</p>
                                                        <p className="font-semibold text-red-500"><Money>₹{rec.currentSpending?.toLocaleString()}</Money></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Target</p>
                                                        <p className="font-semibold text-green-500"><Money>₹{rec.suggestedSpending?.toLocaleString()}</Money></p>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/30">
                                                    <div className="flex gap-2 items-start">
                                                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                        <p className="text-xs text-blue-700 dark:text-blue-300 italic font-medium leading-relaxed">"{rec.opportunityCost}"</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 items-start pt-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0 group-hover:text-green-500 transition-colors" />
                                                    <p className="text-sm font-medium leading-snug">{rec.action}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.details && (
                        <motion.div className="col-span-12 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                            <Card className="shadow-sm border-primary/20 bg-linear-to-b from-primary/5 to-transparent">
                                <CardHeader><CardTitle>Deep Dive Analysis</CardTitle><CardDescription>Comprehensive report generated by our AI financial models</CardDescription></CardHeader>
                                <CardContent><div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-7">{data.summary && <p className="font-semibold text-foreground mb-4 text-lg">{data.summary}</p>}{data.details}</div></CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BudgetAgent;
