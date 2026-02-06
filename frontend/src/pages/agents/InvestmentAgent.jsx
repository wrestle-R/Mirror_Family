import { useState, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Loader2,
    TrendingUp,
    ShieldAlert,
    Target,
    RefreshCw,
    Sparkles,
    BrainCircuit,
    CheckCircle2,
    Lightbulb,
    ArrowRight,
    SlidersHorizontal,
    Plus,
    Wallet
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Money } from "@/components/ui/money";
import {
    RISK_PROFILES,
    calculateWealthProjection,
    generateGrowthCurve
} from "@/utils/simulationUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Custom Node Components ---

const SourceNode = ({ data }) => (
    <div className="p-4 rounded-xl shadow-lg border bg-card w-52 text-center ring-2 ring-primary/20 backdrop-blur-sm">
        <div className="font-semibold text-sm text-foreground mb-1">Monthly Investment</div>
        <div className="text-3xl font-black text-primary tracking-tight"><Money>₹{data.amount.toLocaleString()}</Money></div>
        <div className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">SIP Amount</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-background" />
    </div>
);

const BucketNode = ({ data }) => {
    const colors = {
        conservative: "border-green-500/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300",
        balanced: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
        aggressive: "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
    };

    return (
        <div className={`p-4 rounded-xl shadow-md border-2 w-56 text-center transition-all duration-300 backdrop-blur-md ${colors[data.type] || "border-border"}`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2" />
            <div className="font-bold text-base mb-1">{data.label}</div>
            <div className="flex justify-center items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-background/50 border-current shadow-none text-[10px]">
                    {data.allocation}% Alloc
                </Badge>
            </div>
            <div className="text-2xl font-black tracking-tight"><Money>₹{Math.round(data.value).toLocaleString()}</Money></div>
            <div className="mt-3 text-[10px] leading-tight opacity-90 px-1 font-medium bg-background/30 py-1 rounded">
                projected wealth
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </div>
    );
};

const GoalNode = ({ data }) => {
    if (data.isEmpty) {
        return (
            <div className="p-4 rounded-full border-2 border-dashed border-muted-foreground/30 w-32 h-32 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                <div className="text-xs font-medium text-muted-foreground">Add Goals</div>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-full shadow-lg border-2 bg-gradient-to-b from-card to-secondary/30 w-40 h-40 flex flex-col items-center justify-center text-center transition-all duration-500 ${data.achieved ? 'border-green-500 ring-4 ring-green-500/10' : 'border-destructive/60 opacity-90'}`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-background border border-border" />
            <div className={`p-2 rounded-full mb-2 ${data.achieved ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                <Target className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm px-2 break-words max-w-full leading-tight mb-1">{data.label}</div>
            <div className="text-[10px] text-muted-foreground font-mono">Target: <Money>₹{data.target.toLocaleString()}</Money></div>
            <Badge variant={data.achieved ? "default" : "destructive"} className="mt-2 text-[10px] h-5 px-2 pointer-events-none">
                {data.achieved ? "Achievable" : "Shortfall"}
            </Badge>
        </div>
    );
};

const nodeTypes = {
    source: SourceNode,
    bucket: BucketNode,
    goal: GoalNode,
};

// --- Main Agent Component ---

export default function InvestmentAgent() {
    const { user } = useUser();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Simulation State
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [riskProfile, setRiskProfile] = useState('balanced');
    const [years, setYears] = useState(5);
    const [goals, setGoals] = useState([]);

    // Goal Selection State
    const [selectedGoalId, setSelectedGoalId] = useState('all');

    // AI Data Logic
    const [loading, setLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [aiData, setAiData] = useState(null);

    // Wealth Projections (Math)
    const [projection, setProjection] = useState({ totalValue: 0, gain: 0 });

    // 1. Fetch User Profile & Existing AI Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Profile
                const profileRes = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
                const p = profileRes.data?.data?.profile;
                if (p) {
                    setMonthlyInvestment(p.monthlyBudget * 0.2 || 5000); // Default to 20% of budget

                    if (p.longTermGoals && p.longTermGoals.length > 0) {
                        const userGoals = p.longTermGoals.map((g, i) => ({
                            id: `goal-${i}`,
                            label: typeof g === 'object' ? (g.title || 'Goal') : g,
                            target: typeof g === 'object' ? (g.targetAmount || 100000) : 100000,
                            deadline: typeof g === 'object' ? g.deadline : null
                        }));
                        setGoals(userGoals);
                    } else {
                        setGoals([]);
                    }
                }

                // AI Data
                try {
                    const aiRes = await axios.get(`${API_URL}/api/agents/investment/${user.uid}`);
                    if (aiRes.data && aiRes.data.data) {
                        setAiData(aiRes.data.data);
                    }
                } catch (e) {
                    console.log("No existing AI data found, user can generate.");
                }

            } catch (err) {
                console.error(err);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // 2. Generate AI Insight
    const handleGenerateAI = async () => {
        if (!user) return;
        setGeneratingAI(true);
        try {
            const res = await axios.post(`${API_URL}/api/agents/generate`, { type: 'investment', firebaseUid: user.uid });
            setAiData(res.data.data);
            toast.success("AI Strategy Generated!");
        } catch (error) {
            console.error("Error generating analysis", error);
            toast.error("Failed to generate AI analysis. Check backend.");
        } finally {
            setGeneratingAI(false);
        }
    };


    // 3. Run Simulation & Update Graph
    useEffect(() => {
        if (loading) return;

        // A. Mathematical Projection
        const result = calculateWealthProjection(0, monthlyInvestment, years, riskProfile);
        setProjection(result);

        // B. Rebuild Graph Nodes
        const newNodes = [
            {
                id: 'source',
                type: 'source',
                position: { x: 250, y: 0 },
                data: { amount: monthlyInvestment }
            }
        ];

        const profile = RISK_PROFILES[riskProfile];
        newNodes.push({
            id: 'bucket',
            type: 'bucket',
            position: { x: 275, y: 200 },
            data: {
                label: profile.label,
                allocation: 100,
                type: riskProfile,
                value: result.totalValue,
                desc: aiData ? "Strategy optimized by AI options below" : profile.description
            }
        });

        // Filter goals if one is selected
        const goalsToRender = selectedGoalId === 'all'
            ? goals
            : goals.filter(g => g.id === selectedGoalId);

        // Goal Nodes
        const goalSpacing = 220;
        let goalNodes = [];

        if (goals.length === 0) {
            // Empty State Link
            newNodes.push({
                id: 'goal-empty',
                type: 'goal',
                position: { x: 285, y: 500 },
                data: { isEmpty: true }
            });
            setEdges([
                {
                    id: 'e1',
                    source: 'source',
                    target: 'bucket',
                    animated: true,
                    style: { stroke: '#3b82f6', strokeWidth: 2 }
                },
                {
                    id: 'e-bucket-empty',
                    source: 'bucket',
                    target: 'goal-empty',
                    animated: true,
                    style: { stroke: '#94a3b8', strokeDasharray: '5,5', strokeWidth: 1 }
                }
            ]);
        } else {
            const startX = 250 - ((goalsToRender.length - 1) * goalSpacing) / 2;
            goalNodes = goalsToRender.map((g, i) => ({
                id: g.id,
                type: 'goal',
                position: { x: startX + (i * goalSpacing), y: 500 },
                data: {
                    label: g.label,
                    target: g.target,
                    achieved: result.totalValue >= g.target
                }
            }));

            // C. Rebuild Edges
            const newEdges = [
                {
                    id: 'e1',
                    source: 'source',
                    target: 'bucket',
                    animated: true,
                    style: { stroke: '#3b82f6', strokeWidth: Math.max(2, monthlyInvestment / 2000) }
                },
                ...goalsToRender.map((g) => ({
                    id: `e-bucket-${g.id}`,
                    source: 'bucket',
                    target: g.id,
                    animated: true,
                    style: {
                        stroke: result.totalValue >= g.target ? '#22c55e' : '#ef4444',
                        strokeDasharray: '5,5',
                        strokeWidth: 2
                    }
                }))
            ];
            setEdges(newEdges);
        }

        setNodes([...newNodes, ...goalNodes]);

    }, [monthlyInvestment, riskProfile, years, goals, loading, aiData, selectedGoalId]);


    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    // Helper: Calculate shortfall for selected goal
    const selectedGoalObj = selectedGoalId !== 'all' ? goals.find(g => g.id === selectedGoalId) : null;
    const shortfall = selectedGoalObj ? Math.max(0, selectedGoalObj.target - projection.totalValue) : 0;
    const isGoalMet = selectedGoalObj && shortfall === 0;

    return (
        <div className="h-full w-full p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3 text-inter">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        Investment Command
                    </h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        Simulate your wealth growth and specific goal targets.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/goals">
                        <Button variant="outline">Manage Goals</Button>
                    </Link>
                    <Button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="shadow-lg shadow-primary/20 bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border-none transition-all duration-300"
                    >
                        {generatingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                        {aiData ? "Refresh Strategy" : "Generate Strategy"}
                    </Button>
                </div>
            </div>

            {/* Changed to 3 rows layout (flex-col) instead of 3 columns (grid) */}
            <div className="flex flex-col gap-8 w-full">

                {/* Row 1: Simulation Controls */}
                <Card className="w-full border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                            Simulator Controls
                        </CardTitle>
                        <CardDescription>Adjust your strategy parameters below</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Goal Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focus Goal</label>
                                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Overview (All Goals)</SelectItem>
                                        {goals.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.label} (<Money>₹{(g.target / 100000).toFixed(1)}L</Money>)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Monthly SIP */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Monthly SIP</label>
                                    <Badge variant="secondary" className="font-mono"><Money>₹{monthlyInvestment.toLocaleString()}</Money></Badge>
                                </div>
                                <Slider
                                    value={[monthlyInvestment]}
                                    max={Math.max(100000, monthlyInvestment * 2)}
                                    step={500}
                                    onValueChange={(v) => setMonthlyInvestment(v[0])}
                                    className="cursor-pointer"
                                />
                            </div>

                            {/* Risk Strategy */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">Risk Strategy</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['conservative', 'balanced', 'aggressive'].map((r) => (
                                        <Button
                                            key={r}
                                            variant={riskProfile === r ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setRiskProfile(r)}
                                            className="capitalize text-xs h-8"
                                        >
                                            {r} ({(RISK_PROFILES[r].returnRate * 100).toFixed(0)}%)
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Horizon */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Time Horizon</label>
                                    <span className="font-bold font-mono">{years} Years</span>
                                </div>
                                <Slider
                                    value={[years]}
                                    min={1}
                                    max={40}
                                    step={1}
                                    onValueChange={(v) => setYears(v[0])}
                                />
                            </div>
                        </div>

                        {/* Summary Display in Row 1 */}
                        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex gap-8 items-center">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Projected Total</span>
                                    <div className="text-3xl font-black text-foreground tracking-tight"><Money>₹{(projection.totalValue / 100000).toFixed(2)} L</Money></div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Growth</span>
                                    <div className="text-xl font-bold text-green-600 tracking-tight flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        <Money>+₹{(projection.gain / 100000).toFixed(2)} L</Money>
                                    </div>
                                </div>
                            </div>

                            {selectedGoalObj && (
                                <div className={`flex-1 max-w-md p-3 rounded-xl border flex items-center gap-3 ${isGoalMet ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                                    {isGoalMet ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> : <Target className="w-6 h-6 text-red-500 shrink-0" />}
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{selectedGoalObj.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {isGoalMet
                                                ? <><Money>Surplus: ₹{(projection.totalValue - selectedGoalObj.target).toLocaleString()}</Money></>
                                                : <><Money>Shortfall: ₹{shortfall.toLocaleString()}</Money></>}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Interactive Graph */}
                <Card className="w-full h-[600px] border-none bg-muted/20 shadow-inner relative overflow-hidden ring-1 ring-border/10 rounded-xl">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-dot-pattern"
                    >
                        <Background color="currentColor" className="opacity-5" gap={20} size={1} />
                        <Controls className="bg-background/90 border-border shadow-sm p-1 rounded-lg" />
                    </ReactFlow>
                    <div className="absolute top-4 right-4 bg-background/50 backdrop-blur px-3 py-1 rounded-full text-[10px] text-muted-foreground z-10">
                        Interactive Flow Engine
                    </div>
                </Card>

                {/* Row 3: AI Advisor Panel with Fixed Height for Scrollability */}
                <Card className="w-full border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col h-[500px]">
                    <CardHeader className="bg-muted/30 pb-4 border-b shrink-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BrainCircuit className="w-4 h-4 text-purple-600" />
                            AI Strategy Advisor
                        </CardTitle>
                        <CardDescription>Comprehensive personalized analysis</CardDescription>
                    </CardHeader>

                    {!aiData ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-inter">Generate Your Strategy</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Click the button in the header to unlock a deep-dive AI analysis of your financial future.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 overflow-y-auto w-full">
                            <CardContent className="space-y-8 pt-6 pb-12">
                                <div className="space-y-8">
                                    {/* Top Section: Summary & Tips */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Summary Column */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                The Big Picture
                                            </h4>
                                            <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-primary/10">
                                                {aiData.summary}
                                            </p>
                                        </div>

                                        {/* Actions Column */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                Priority Actions
                                            </h4>
                                            <ul className="space-y-3">
                                                {aiData.tips?.map((tip, i) => (
                                                    <li key={i} className="flex gap-4 text-sm group">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Recommendations Section */}
                                    {aiData.recommendations && aiData.recommendations.length > 0 ? (
                                        <div className="space-y-4 pt-4 border-t">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                Recommended Investment Options
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {aiData.recommendations.map((rec, idx) => (
                                                    <div key={idx} className="group relative bg-card hover:bg-card/80 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500" />
                                                        <div className="p-5 space-y-4">
                                                            {/* Header */}
                                                            <div>
                                                                <h3 className="font-bold text-lg text-primary group-hover:underline decoration-wavy underline-offset-4">{rec.name}</h3>
                                                            </div>

                                                            {/* Content Grid */}
                                                            <div className="space-y-3 text-sm">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">What is it?</span>
                                                                    <p className="text-foreground/90 leading-tight">{rec.whatItIs}</p>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg">
                                                                    <div>
                                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Risk</span>
                                                                        <span className={`font-medium ${rec.riskLevel?.toLowerCase().includes('low') ? 'text-green-600' : rec.riskLevel?.toLowerCase().includes('high') ? 'text-red-500' : 'text-amber-600'}`}>
                                                                            {rec.riskLevel}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Time</span>
                                                                        <span className="font-medium">{rec.timeHorizon}</span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Why for you?</span>
                                                                    <p className="text-muted-foreground italic text-xs" dangerouslySetInnerHTML={{ __html: rec.whyRecommended }} />
                                                                </div>

                                                                <div className="flex gap-2 items-start bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                                                                    <Wallet className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                                                    <div>
                                                                        <span className="text-[10px] uppercase font-bold text-blue-600 block">Example</span>
                                                                        <p className="text-xs text-blue-700 dark:text-blue-300">{rec.example}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 items-start bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900">
                                                                    <ShieldAlert className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                                                    <div>
                                                                        <span className="text-[10px] uppercase font-bold text-amber-600 block">Caution</span>
                                                                        <p className="text-xs text-amber-700 dark:text-amber-300">{rec.caution}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // Fallback legacy content
                                        aiData.details && (
                                            <div className="space-y-4 pt-4 border-t">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    Deep Dive
                                                </h4>
                                                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans bg-secondary/30 p-4 rounded-xl border border-border">
                                                    {aiData.details}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </ScrollArea>
                    )}

                    {/* Informative Footer for Advisor */}
                    {aiData && (
                        <div className="p-3 bg-muted/50 border-t shrink-0 flex justify-between items-center text-[10px] text-muted-foreground px-6">
                            <span>Analysis based on profile data as of {new Date().toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                <span>AI Optimized</span>
                            </div>
                        </div>
                    )}
                </Card>

            </div>
        </div>
    );
}
