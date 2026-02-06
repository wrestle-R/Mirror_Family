import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Layout } from "@/components/Dashboard/Layout";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Transactions from "@/pages/Transactions";
import BudgetAgent from "@/pages/agents/BudgetAgent";
import SavingsAgent from "@/pages/agents/SavingsAgent";
import DebtAgent from "@/pages/agents/DebtAgent";
import InvestmentAgent from "@/pages/agents/InvestmentAgent";
import GoalPlans from "@/pages/GoalPlans";
import Groups from "@/pages/Groups";
import GroupDetailsPage from "@/pages/GroupDetailsPage";
import NotFound from "@/pages/NotFound";
import FinancialCommandCenter from "@/pages/FinancialCommandCenter";


console.log("App: Initializing Money Council application");

function App() {
  console.log("App: Rendering main application");

  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard/*" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="goals" element={<GoalPlans />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:groupId" element={<GroupDetailsPage />} />
              <Route path="agent/budget" element={<BudgetAgent />} />
              <Route path="agent/savings" element={<SavingsAgent />} />
              <Route path="agent/debt" element={<DebtAgent />} />
              <Route path="agent/investment" element={<InvestmentAgent />} />
              <Route path="command-center" element={<FinancialCommandCenter />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
