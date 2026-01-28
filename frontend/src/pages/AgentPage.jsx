import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, PiggyBank, Target, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AgentPage = () => {
  const { type } = useParams();
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Map type to display info
  const agentInfo = {
    budget: { title: "Budget Agent", icon: Wallet, color: "#3b82f6" },
    savings: { title: "Savings Agent", icon: PiggyBank, color: "#10b981" },
    debt: { title: "Debt Manager", icon: TrendingDown, color: "#ef4444" },
    investment: { title: "Investment Scout", icon: TrendingUp, color: "#8b5cf6" }
  };

  const info = agentInfo[type] || agentInfo.budget;

  useEffect(() => {
    fetchData();
  }, [type, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/agents/${type}/${user.uid}`);
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Error fetching agent data", error);
      // If 404, it just means no data yet
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/api/agents/generate`, {
        type,
        firebaseUid: user.uid
      });
      setData(res.data.data);
      toast.success("Analysis generated successfully!");
    } catch (error) {
      console.error("Error generating analysis", error);
      toast.error("Failed to generate analysis.");
    } finally {
      setGenerating(false);
    }
  };

  // Chart Rendering Helper
  const renderChart = () => {
    if (!data?.chartData || data.chartData.length === 0) return null;

    if (type === 'budget') { // Pie Chart for Expenses
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'savings' || type === 'investment') { // Line/Area Chart for growth
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={info.color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default Bar Chart (Debt or others)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Bar dataKey="value" fill={info.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <info.icon className="w-6 h-6 text-primary" style={{ color: info.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{info.title}</h1>
            <p className="text-muted-foreground">AI-Powered Financial Analysis</p>
          </div>
        </div>
        
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {data ? "Regenerate Analysis" : "Generate Analysis"}
        </Button>
      </div>

      {!data ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <info.icon className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No Analysis Yet</h3>
            <p className="text-muted-foreground mb-4">Generate your first AI report for {info.title}.</p>
            <Button onClick={handleGenerate} disabled={generating}>
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Chart Card */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>{data.summary || "Analysis of your current financial standing."}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Strategic Tips</CardTitle>
              <CardDescription>Actionable advice to improve.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {data.tips?.map((tip, i) => (
                  <li key={i} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/50">
                    <div className="mt-0.5 min-w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Details Card */}
          {data.details && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Detailed Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {data.details}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentPage;
