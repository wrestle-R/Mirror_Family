import { useEffect, useState } from "react";
import { Layout } from "@/components/Dashboard/Layout";
import { useUser } from "@/context/UserContext";
import { 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Dashboard = () => {
  const { user, student } = useUser();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName = student?.name || user?.displayName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchProfile = async () => {
        if (user?.uid) {
            try {
                const response = await axios.get(`${API_URL}/api/student/profile/${user.uid}`);
                if (response.data.success) {
                    setProfileData(response.data.data.profile);
                }
            } catch (error) {
                console.error("Error fetching profile stats:", error);
            } finally {
                setLoading(false);
            }
        }
    };
    fetchProfile();
  }, [user]);

  const stats = [
    {
      title: "Monthly Budget",
      value: loading ? "..." : `₹${profileData?.monthlyBudget || 0}`,
      change: profileData?.monthlyBudget ? "Budget active" : "Set up your budget",
      trend: "neutral",
      icon: Wallet,
      color: "text-chart-1"
    },
    {
      title: "Short Term Goal",
      value: loading ? "..." : (profileData?.shortTermGoals ? "Active" : "None"),
      change: profileData?.shortTermGoals || "Create a goal",
      trend: "neutral",
      icon: PiggyBank,
      color: "text-chart-2"
    },
    {
      title: "Financial Condition",
      value: loading ? "..." : (profileData?.financialCondition || "Unknown"),
      change: "Current Status",
      trend: "neutral",
      icon: CreditCard,
      color: "text-chart-4"
    },
    {
      title: "Long Term Goal",
      value: loading ? "..." : (profileData?.longTermGoals ? "Active" : "None"),
      change: profileData?.longTermGoals || "Plan for future",
      trend: "neutral",
      icon: TrendingUp,
      color: "text-chart-3"
    }
  ];

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
             <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
             <p className="text-muted-foreground">Welcome back, {displayName}!</p>
          </div>
          <div className="flex items-center space-x-2">
            {!profileData?.monthlyBudget && !loading && (
                <Button onClick={() => navigate("/profile")}>Complete Profile</Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                    <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                    <div className="text-2xl font-bold truncate">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground truncate h-4" title={typeof stat.change === 'string' ? stat.change : ''}>
                  {loading ? <Skeleton className="h-3 w-32" /> : stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground">
                        Chart capability coming soon
                    </div>
                </CardContent>
            </Card>
             <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        You have no recent transactions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    
                </CardContent>
             </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
