import { LogOut, User, Moon, Sun, LayoutDashboard, GraduationCap, Receipt, Target, Wallet, PiggyBank, TrendingDown, TrendingUp, Users, CandlestickChart } from "lucide-react"
import { useUser } from "../../context/UserContext"
import { useTheme } from "../../context/ThemeContext"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate, Link } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
  SidebarHeader
} from "@/components/ui/sidebar"

// Menu items. Adapted for Money Council (Fintech for Students)
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
  },
  {
    title: "Goal Plans",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Split",
    url: "/groups",
    icon: Users,
  },
  {
    title: "Stock Picks",
    url: "/stocks",
    icon: CandlestickChart,
  },
  {
    title: "Budget Agent",
    url: "/agent/budget",
    icon: Wallet,
  },
  {
    title: "Savings Agent",
    url: "/agent/savings",
    icon: PiggyBank,
  },
  {
    title: "Debt Manager",
    url: "/agent/debt",
    icon: TrendingDown,
  },
  {
    title: "Investment Scout",
    url: "/agent/investment",
    icon: TrendingUp,
  }
]

export function AppSidebar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const location = useLocation();

  const isActive = (url) => location.pathname === url;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Money Council</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link to="/profile">
                <User />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip="Toggle Theme">
              {theme === "dark" ? <Sun /> : <Moon />}
              <span>Toggle Theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive" tooltip="Log out">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

