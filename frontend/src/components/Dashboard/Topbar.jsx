import { Bell, Search, Menu, LogOut, User, Settings, Zap } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSandbox } from "@/context/SandboxContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";

export function Topbar({ onMenuClick }) {
  const { user, student, logout } = useUser();
  const { isSandboxEnabled, toggleSandbox, viewMode, toggleViewMode, loading } = useSandbox();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  console.log("Topbar: Rendering, user:", user?.email);

  const displayName = student?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const profilePhoto = student?.profilePhoto || user?.photoURL;

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 transition-colors duration-500 relative overflow-hidden">
      {isSandboxEnabled && (
         <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 pointer-events-none animate-pulse" />
      )}
      
      <div className="flex items-center gap-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 w-48"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 z-10 w-full justify-end sm:w-auto">
        {/* TIME MACHINE CONTROLS - ONLY ON DASHBOARD */}
        {isDashboard && (
          <div className="flex items-center gap-4 mr-2">
            <div className="flex items-center gap-2">
               <Label htmlFor="sandbox-mode" className={`text-xs font-bold ${isSandboxEnabled ? 'text-purple-500' : 'text-muted-foreground'}`}>
                 {isSandboxEnabled ? 'FUTURE VIEW (2036)' : 'TIME MACHINE'}
               </Label>
               <Switch 
                 id="sandbox-mode" 
                 checked={isSandboxEnabled}
                 onCheckedChange={toggleSandbox}
                 className="data-[state=checked]:bg-purple-600"
               />
            </div>
            
            {isSandboxEnabled && (
              <div className="flex items-center bg-background/50 border border-purple-500/30 rounded-full p-1 h-8 animate-in fade-in slide-in-from-top-2">
                  <Button 
                    variant={viewMode === 'current' ? "secondary" : "ghost"} 
                    size="sm" 
                    className={`h-6 text-xs rounded-full px-3 ${viewMode === 'current' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'text-muted-foreground'}`}
                    onClick={() => viewMode !== 'current' && toggleViewMode()}
                  >
                    Current Habits
                  </Button>
                  <Button 
                    variant={viewMode === 'optimized' ? "secondary" : "ghost"} 
                    size="sm" 
                    className={`h-6 text-xs rounded-full px-3 ${viewMode === 'optimized' ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30' : 'text-muted-foreground'}`}
                    onClick={() => viewMode !== 'optimized' && toggleViewMode()}
                  >
                    <Zap className="w-3 h-3 mr-1 fill-current" />
                    Optimized
                  </Button>
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-auto p-0 hover:bg-transparent">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-foreground font-medium">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
