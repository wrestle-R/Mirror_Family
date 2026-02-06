import { LogOut, User, Moon, Sun, LayoutDashboard, GraduationCap, Receipt, Target, Wallet, PiggyBank, TrendingDown, TrendingUp, Users, CandlestickChart, Activity, Clock, Tv2, ChevronDown, EyeOff, Eye } from "lucide-react"
import { useUser } from "../../context/UserContext"
import { useTheme } from "../../context/ThemeContext"
import { useStealth } from "../../context/StealthContext"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useState } from "react"

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Menu items. Adapted for Money Council (Fintech for Students)
const itemGroups = {
  main: {
    label: "Main",
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
      {
        title: "Council Synthesis",
        url: "/council-synthesis",
        icon: Tv2,
      }
    ]
  },
  finance: {
    label: "Finance Tools",
    items: [
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
        title: "Time Machine",
        url: "/time-machine",
        icon: Clock,
      },
      {
        title: "Split",
        url: "/groups",
        icon: Users,
      }
    ]
  },
  investments: {
    label: "Invest",
    items: [
      {
        title: "Stock Picks",
        url: "/stocks",
        icon: CandlestickChart,
      },
      {
        title: "Investment Scout",
        url: "/agent/investment",
        icon: TrendingUp,
      }
    ]
  },
  agents: {
    label: "Agents",
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
      }
    ]
  }
}

export function AppSidebar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const { stealthMode, toggleStealth } = useStealth();
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({
    main: true,
    finance: true,
    investments: true,
    agents: true
  });

  const isActive = (url) => location.pathname === url;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
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
        {Object.entries(itemGroups).map(([key, group]) => (
          <Collapsible
            key={key}
            open={openGroups[key]}
            onOpenChange={() => toggleGroup(key)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1.5 text-sm">
                  {group.label}
                  <ChevronDown className={cn(
                    "ml-auto h-4 w-4 transition-transform duration-200",
                    openGroups[key] && "rotate-180"
                  )} />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
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
            <SidebarMenuButton onClick={toggleStealth} tooltip="Stealth Mode">
              {stealthMode ? <Eye /> : <EyeOff />}
              <span>Stealth Mode</span>
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

