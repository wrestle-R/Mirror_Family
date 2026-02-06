import { LogOut, User, Moon, Sun, LayoutDashboard, GraduationCap, Receipt, Target, Wallet, PiggyBank, TrendingDown, TrendingUp, Users, CandlestickChart, Activity, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
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
  SidebarHeader,
  SidebarSeparator
} from "@/components/ui/sidebar"

// Menu items. Adapted for Money Council (Fintech for Students)
// Menu items grouped by sections
const groups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Command Center",
        url: "/command-center",
        icon: Activity,
      },
    ]
  },
  {
    label: "Activities",
    items: [
      {
        title: "Transactions",
        url: "/transactions",
        icon: Receipt,
      },
      {
        title: "Split (Groups)",
        url: "/groups",
        icon: Users,
      },
    ]
  },
  {
    label: "AI Intelligence",
    items: [
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
    ]
  },
  {
    label: "Wealth & Investment",
    items: [
      {
        title: "Investment Scout",
        url: "/agent/investment",
        icon: TrendingUp,
      },
      {
        title: "Stock Picks",
        url: "/stocks",
        icon: CandlestickChart,
      },
      {
        title: "Goal Plans",
        url: "/goals",
        icon: Target,
      },
    ]
  }
]

export function AppSidebar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const [expandedGroups, setExpandedGroups] = useState(
    groups.reduce((acc, group) => ({ ...acc, [group.label]: true }), {})
  );

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

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
        {groups.map((group, index) => {
          const isExpanded = expandedGroups[group.label];
          return (
            <div key={group.label}>
              <SidebarGroup>
                <div
                  className={cn(
                    "flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors",
                    isCollapsed && "justify-center px-0"
                  )}
                  onClick={() => toggleGroup(group.label)}
                >
                  <SidebarGroupLabel className="cursor-pointer py-0 h-auto m-0 select-none">
                    {group.label}
                  </SidebarGroupLabel>
                  {!isCollapsed && (
                    isExpanded ? <ChevronDown className="size-3 text-sidebar-foreground/50 transition-transform duration-200" /> : <ChevronRight className="size-3 text-sidebar-foreground/50 transition-transform duration-200" />
                  )}
                </div>

                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
                )}>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
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
                </div>
              </SidebarGroup>
              {index < groups.length - 1 && <SidebarSeparator />}
            </div>
          );
        })}
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

