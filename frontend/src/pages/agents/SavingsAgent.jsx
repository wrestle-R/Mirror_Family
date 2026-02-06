import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { Loader2, RefreshCw, PiggyBank, Target, TrendingUp, CheckCircle2, MoreHorizontal, Flag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Money } from "@/components/ui/money";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Mermaid Component ---
const MermaidDiagram = ({ chart }) => {
    const containerRef = useRef(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!chart) return;

        const loadMermaid = async () => {
            if (!window.mermaid) {
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
                script.async = true;
                script.onload = () => initMermaid();
                script.onerror = () => setError(true);
                document.body.appendChild(script);
            } else {
                initMermaid();
            }
        };

        const initMermaid = () => {
            if (window.mermaid) {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    securityLevel: 'loose',
                    flowchart: { curve: 'basis', htmlLabels: true }
                });
                renderDiagram();
            }
        };

        const renderDiagram = async () => {
            await new Promise(r => setTimeout(r, 100));
            if (window.mermaid && containerRef.current) {
                try {
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await window.mermaid.render(id, chart);
                    containerRef.current.innerHTML = svg;
                    setError(false);
                } catch (e) {
                    console.error("Mermaid Render Error:", e);
                    setError(true);
                }
            }
        };

        loadMermaid();
    }, [chart]);

    if (error) {
        return (
            <div className="w-full p-6 bg-muted/10 rounded-xl border border-border/50 min-h-[150px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Diagram unavailable</p>
            </div>
        );
    }

    return (
        <div className="mermaid-container w-full overflow-x-auto flex justify-center p-8 bg-white dark:bg-muted/10 rounded-xl border border-border/50 min-h-[200px]" ref={containerRef}>
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Rendering Strategy Flow...
            </div>
        </div>
    );
};


const SavingsAgent = () => {
    const type = "savings";
    const { user } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [profile, setProfile] = useState(null);
    const [adjustment, setAdjustment] = useState(0);

    const info = {
        title: "Savings Strategist",
        description: "Advanced simulation & strategic execution planning.",
        icon: PiggyBank
    };

    useEffect(() => {
        if (!user) return;
        axios.get(`${API_URL}/api/student/profile/${user.uid}`)
            .then(res => { if (res.data?.data?.profile) setProfile(res.data.data.profile); })
            .catch(err => console.error("Error fetching profile", err));
    }, [user]);

    useEffect(() => { fetchData(); }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/agents/${type}/${user.uid}`);
            console.log("📊 Savings Agent Data Response:", res.data);
            if (res.data && res.data.data) {
                console.log("✅ Setting data:", res.data.data);
                setData(res.data.data);
            } else {
                console.log("❌ No data in response");
                setData(null);
            }
        } catch (error) {
            console.error("❌ Error fetching agent data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/api/agents/generate`, { type, firebaseUid: user.uid });
            console.log("🎯 Generated Savings Data:", res.data);
            if (res.data?.data) {
                setData(res.data.data);
                setAdjustment(0);
                toast.success("Strategy generated!");
            } else {
                toast.error("No data returned from API");
            }
        } catch (error) {
            console.error("❌ Error generating analysis", error);
            toast.error("Failed to generate analysis.");
        } finally {
            setGenerating(false);
        }
    };

    const convaiVariables = useMemo(() => ({
        user_name: user?.displayName || profile?.name || "User",
        agent_type: type,
        monthly_surplus: data?.monthly_surplus || 0,
        has_analysis: data ? "yes" : "no",
    }), [user, profile, data]);

    // --- Simulation Logic with Robust Defaults ---
    const params = useMemo(() => {
        if (!data) return { base_monthly_contribution: 0, current_total_savings: 0, total_goal_target: 100000 };

        return {
            base_monthly_contribution: data.simulation_parameters?.base_monthly_contribution || data.monthly_surplus || 0,
            current_total_savings: data.simulation_parameters?.current_total_savings || 0,
            total_goal_target: data.simulation_parameters?.total_goal_target || 100000
        };
    }, [data]);

    console.log("💰 Simulation Parameters:", params);

    const baseContribution = params.base_monthly_contribution || 0;
    const currentContribution = Math.max(0, baseContribution + adjustment);
    const goalTarget = params.total_goal_target || 100000;
    const startAmount = params.current_total_savings || 0;

    // Generate Growth Curve
    const simulatedChartData = useMemo(() => {
        const months = 36;
        const curve = [];
        let intersectionMonth = null;

        for (let i = 0; i <= months; i++) {
            const projected = startAmount + (currentContribution * i);

            if (intersectionMonth === null && projected >= goalTarget) {
                intersectionMonth = i;
            }

            curve.push({
                month: i,
                name: i === 0 ? 'Now' : `M${i}`,
                Accumulated: projected,
                Goal: goalTarget
            });
        }

        console.log("📈 Chart Generated:", { curveLength: curve.length, intersectionMonth, goalTarget, currentContribution });
        return { curve, intersectionMonth };
    }, [currentContribution, startAmount, goalTarget]);

    const { curve, intersectionMonth } = simulatedChartData;
    const intersectionPoint = intersectionMonth !== null ? curve[intersectionMonth] : null;

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen w-full p-4 lg:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <PiggyBank className="w-8 h-8 text-green-700 dark:text-green-400" />
                        </div>
                        {info.title}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-base">{info.description}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {data ? "Refresh Strategy" : "Generate Strategy"}
                    </Button>
                </div>
            </div>

            {/* <elevenlabs-convai agent-id="agent_7101kg2q76p1ewz9x195s6yt4twz" dynamic-variables={JSON.stringify(convaiVariables)} /> */}

            {!data ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mb-6">
                            <Target className="w-12 h-12 text-green-600/50" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Build Your Wealth Plan</h3>
                        <p className="text-muted-foreground mb-8 max-w-md text-lg">
                            Let AI analyze your finances and build a custom roadmap to reach your goals faster.
                        </p>
                        <Button onClick={handleGenerate} disabled={generating} size="lg" className="px-8">
                            {generating ? "Generating..." : "Start Planning"}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* TOP SECTION: Simulation & Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Chart (Large) */}
                        <div className="lg:col-span-8">
                            <Card className="h-full border-none shadow-sm flex flex-col">
                                <CardHeader>
                                    <CardTitle>Wealth Trajectory</CardTitle>
                                    <CardDescription>Projected growth vs Total Goals Target (₹{(goalTarget / 1000).toFixed(0)}k)</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={curve} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={5} />
                                            <YAxis orientation="left" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={10} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                                            />
                                            <ReferenceLine y={goalTarget} label={{ position: 'insideTopRight', value: `Goal: ₹${(goalTarget / 1000).toFixed(0)}k`, fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="3 3" />

                                            {intersectionMonth !== null && intersectionMonth < curve.length && (
                                                <>
                                                    <ReferenceLine x={curve[intersectionMonth].name} stroke="#10b981" strokeDasharray="3 3" />
                                                    <ReferenceDot
                                                        x={curve[intersectionMonth].name}
                                                        y={intersectionPoint?.Accumulated || goalTarget}
                                                        r={6}
                                                        fill="#10b981"
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                </>
                                            )}

                                            <Area type="monotone" dataKey="Accumulated" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Controls (Sticky) */}
                        <div className="lg:col-span-4">
                            <Card className="sticky top-6 border-l-4 border-l-primary shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Power Simulator
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Monthly Input</p>
                                                <p className="text-3xl font-black text-primary mt-1"><Money>₹{currentContribution.toLocaleString()}</Money></p>
                                            </div>
                                        </div>

                                        <Slider
                                            value={[adjustment]}
                                            onValueChange={(v) => setAdjustment(v[0])}
                                            max={50000}
                                            min={-Math.min(baseContribution, 20000)}
                                            step={1000}
                                            className="py-2"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-3 font-mono">
                                            <span>Base: <Money>₹{baseContribution.toLocaleString()}</Money></span>
                                            <span>Max Boost</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 border border-border/50 text-center space-y-1">
                                        {intersectionMonth !== null ? (
                                            <>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goal Achievement</p>
                                                <div className="text-2xl font-black text-green-600 flex items-center justify-center gap-2">
                                                    <Flag className="w-5 h-5 fill-green-600 text-green-600" />
                                                    {intersectionMonth} Months
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {(intersectionMonth / 12).toFixed(1)} Years from now
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-orange-500 font-bold flex items-center justify-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Goals beyond 3-year horizon
                                            </p>
                                        )}
                                    </div>

                                    {data.summary && (
                                        <div className="pt-4 border-t space-y-2">
                                            <h4 className="font-bold text-sm">AI Insights</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* MIDDLE SECTION: Execution Plan */}
                    {data.comprehensive_plan && data.comprehensive_plan.length > 0 && (
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Execution Plan</CardTitle>
                                        <CardDescription>Strategic steps recommended by AI</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {data.comprehensive_plan.map((step, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="text-4xl font-black text-muted-foreground/20">{step.step}</div>
                                            <div className="space-y-1 pt-1">
                                                <h4 className="font-bold text-sm text-foreground">{step.title}</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tips Section */}
                    {data.tips && data.tips.length > 0 && (
                        <Card className="border-none shadow-sm bg-muted/10">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" /> Quick Wins
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {data.tips.map((tip, i) => (
                                        <div key={i} className="flex gap-2 items-start text-sm bg-white dark:bg-black/20 p-3 rounded-lg border">
                                            <div className="min-w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* BOTTOM SECTION: Detailed Flowchart */}
                    {data.mermaid_diagram && (
                        <Card className="overflow-hidden border-none shadow-sm">
                            <CardHeader className="bg-muted/10 pb-4 border-b">
                                <div className="flex items-center gap-2">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Visual Strategy Map</CardTitle>
                                </div>
                            </CardHeader>
                            <div className="p-0 bg-white dark:bg-black/20">
                                <MermaidDiagram chart={data.mermaid_diagram} />
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default SavingsAgent;
