import { Layout } from "@/components/Dashboard/Layout";
import { useUser } from "@/context/UserContext";
import { 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { user, student } = useUser();

  console.log("Dashboard: Rendering, user:", user?.email, "student:", student?.name);

  const displayName = student?.name || user?.displayName || user?.email?.split("@")[0] || "User";

  const stats = [
    {
      title: "Monthly Budget",
      value: "₹0",
      change: "Set up your budget",
      trend: "neutral",
      icon: Wallet,
      color: "text-chart-1"
    },
    {
      title: "Savings Goal",
      value: "₹0",
      change: "Create a savings goal",
      trend: "neutral",
      icon: PiggyBank,
      color: "text-chart-2"
    },
    {
      title: "Total Debt",
      value: "₹0",
      change: "Track your debt",
      trend: "neutral",
      icon: CreditCard,
      color: "text-chart-4"
    },
    {
      title: "Investments",
      value: "₹0",
      change: "Start investing",
      trend: "neutral",
      icon: TrendingUp,
      color: "text-chart-3"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your financial health
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.trend === "up" && <ArrowUpRight className="w-3 h-3 text-chart-2" />}
                  {stat.trend === "down" && <ArrowDownRight className="w-3 h-3 text-destructive" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Complete your profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your income, expenses, and financial goals
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Set your budget</h4>
                  <p className="text-sm text-muted-foreground">
                    Create spending categories and limits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Get AI recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized financial advice
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your AI Council</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Budget Agent</h4>
                  <p className="text-xs text-muted-foreground">Ready to analyze spending</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Savings Agent</h4>
                  <p className="text-xs text-muted-foreground">Ready to create savings plans</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Debt Manager</h4>
                  <p className="text-xs text-muted-foreground">Ready to optimize repayments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
