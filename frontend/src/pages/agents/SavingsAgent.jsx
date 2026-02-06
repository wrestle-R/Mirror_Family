import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Loader2, RefreshCw, PiggyBank, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SavingsAgent = () => {
    const type = "savings";
    const { user } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [profile, setProfile] = useState(null);

    const info = {
        title: "Savings Agent",
        icon: PiggyBank,
        color: "#10b981",
        description: "Reach your financial goals faster."
    };

    useEffect(() => {
        if (!user) return;
        axios.get(`${API_URL}/api/student/profile/${user.uid}`)
            .then(res => { if (res.data?.data?.profile) setProfile(res.data.data.profile); })
            .catch(err => console.error("Error fetching profile", err));
    }, [user]);

    useEffect(() => { fetchData(); }, [user]);

    useEffect(() => {
        if (customElements.get('elevenlabs-convai')) return;
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, []);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/agents/${type}/${user.uid}`);
            if (res.data && res.data.data) setData(res.data.data);
            else setData(null);
        } catch (error) { console.error("Error fetching agent data", error); } finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/api/agents/generate`, { type, firebaseUid: user.uid });
            setData(res.data.data);
            toast.success("Analysis generated successfully!");
        } catch (error) { console.error("Error generating analysis", error); toast.error("Failed to generate analysis."); } finally { setGenerating(false); }
    };

    const renderChart = () => {
        if (!data?.chartData || data.chartData.length === 0) return null;
        const dataKeys = Object.keys(data.chartData[0]).filter(key => key !== 'name');
        const colors = [info.color, "#f59e0b", "#3b82f6", "#ef4444", "#ec4899"];

        return (
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.chartData}>
                        <defs>
                            {dataKeys.map((key, index) => (
                                <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`₹${value.toLocaleString()}`, ""]} labelStyle={{ color: "#64748b", marginBottom: "0.25rem" }} />
                        <Legend iconType="circle" />
                        {dataKeys.map((key, index) => (
                            <Area key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} fillOpacity={1} fill={`url(#color-${key})`} strokeWidth={2} name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()} />
                        ))}
                    </AreaChart>
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
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <Button onClick={handleGenerate} disabled={generating} size="lg" className="shadow-lg shadow-primary/20">
                        {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {data ? "Regenerate Analysis" : "Generate Analysis"}
                    </Button>
                </div>
            </div>

            {/* <elevenlabs-convai agent-id="agent_7101kg2q76p1ewz9x195s6yt4twz" dynamic-variables={JSON.stringify(convaiVariables)} /> */}

            {!data ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <BarChart3 className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Analysis Generated Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">Get personalized AI insights for your savings specifically tailored to your financial profile.</p>
                        <Button onClick={handleGenerate} disabled={generating}>Start AI Analysis</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-12">
                    <Card className="col-span-12 md:col-span-8 shadow-sm">
                        <CardHeader>
                            <CardTitle>Savings Projection</CardTitle>
                            <CardDescription>Visual analysis of your current trajectory vs potential growth</CardDescription>
                        </CardHeader>
                        <CardContent>{renderChart()}</CardContent>
                    </Card>
                    <Card className="col-span-12 md:col-span-4 shadow-sm h-full">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Action Plan</CardTitle>
                            <CardDescription>Top strategic recommendations</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {data.tips?.map((tip, i) => (
                                    <li key={i} className="flex gap-3 items-start">
                                        <div className="mt-0.5 min-w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</div>
                                        <span className="text-sm font-medium leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    {data.details && (
                        <Card className="col-span-12 shadow-sm border-primary/20 bg-linear-to-b from-primary/5 to-transparent">
                            <CardHeader><CardTitle>Deep Dive Analysis</CardTitle><CardDescription>Comprehensive report generated by our AI financial models</CardDescription></CardHeader>
                            <CardContent><div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-7">{data.summary && <p className="font-semibold text-foreground mb-4 text-lg">{data.summary}</p>}{data.details}</div></CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default SavingsAgent;
