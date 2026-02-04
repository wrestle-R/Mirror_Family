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
import AgentPage from "@/pages/AgentPage";
import GoalPlans from "@/pages/GoalPlans";
import NotFound from "@/pages/NotFound";


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
              <Route path="agent/:type" element={<AgentPage />} />
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
