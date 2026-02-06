import { useState, useEffect, useMemo, useCallback } from "react";
import { Player } from "@remotion/player";
import { Play, Pause, RotateCcw, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";
import { toast } from "sonner";
import CouncilSynthesisVideo from "@/remotion/CouncilSynthesis/CouncilSynthesisVideo";
import { FPS, TOTAL_FRAMES, DARK_COLORS, LIGHT_COLORS } from "@/remotion/CouncilSynthesis/constants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function CouncilSynthesis() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [playerRef, setPlayerRef] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [synthesisData, setSynthesisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState(null);

  // Theme-aware colors for video
  const colors = useMemo(() => {
    return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  }, [theme]);

  const inputProps = useMemo(
    () => ({ data: synthesisData, colors }),
    [synthesisData, colors]
  );

  // Fetch synthesis data from backend
  const fetchSynthesis = useCallback(async (showToast = false) => {
    if (!user?.uid) return;
    
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const response = await axios.get(`${API_URL}/api/synthesis/${user.uid}`);
      
      if (response.data.success) {
        setSynthesisData(response.data.data);
        setMeta(response.data.meta);
        if (showToast) {
          toast.success("Synthesis refreshed successfully");
        }
      } else {
        toast.error("Failed to load synthesis data");
      }
    } catch (error) {
      console.error("Error fetching synthesis:", error);
      if (showToast) {
        toast.error("Failed to refresh synthesis");
      }
      // Use default fallback data on error
      setSynthesisData(getDefaultData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSynthesis(false);
  }, [fetchSynthesis]);

  // Track current frame when playing
  useEffect(() => {
    if (!playerRef) return;

    const interval = setInterval(() => {
      const frame = playerRef.getCurrentFrame();
      if (frame !== null) {
        setCurrentFrame(frame);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerRef]);

  const handlePlayPause = () => {
    if (!playerRef) return;
    if (isPlaying) {
      playerRef.pause();
    } else {
      playerRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    if (!playerRef) return;
    playerRef.seekTo(0);
    playerRef.play();
    setIsPlaying(true);
    setCurrentFrame(0);
  };

  const handleSeek = (value) => {
    if (!playerRef) return;
    const frame = value[0];
    playerRef.seekTo(frame);
    setCurrentFrame(frame);
  };

  const handleRefresh = () => {
    fetchSynthesis(true);
    // Reset video when refreshing
    if (playerRef) {
      playerRef.pause();
      playerRef.seekTo(0);
      setIsPlaying(false);
      setCurrentFrame(0);
    }
  };

  const formatTime = (frame) => {
    const seconds = Math.floor(frame / FPS);
    const remainingFrames = frame % FPS;
    return `${seconds}:${String(Math.floor(remainingFrames / 3)).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Council Synthesis...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Council Synthesis
          </h1>
          <p className="text-muted-foreground mt-1">
            A 30-second AI briefing synthesized from all four agents.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 self-start md:self-center"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Data
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border bg-card shadow-lg">
        <div 
          className="relative aspect-video"
          style={{ backgroundColor: colors.background }}
        >
          <Player
            ref={(ref) => setPlayerRef(ref)}
            component={CouncilSynthesisVideo}
            inputProps={inputProps}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            compositionWidth={1280}
            compositionHeight={720}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls={false}
            autoPlay={false}
            loop={false}
            clickToPlay={false}
          />
        </div>

        {/* Custom Controls */}
        <div className="px-4 py-3 bg-card border-t border-border space-y-3">
          {/* Scrubber/Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono w-10">
              {formatTime(currentFrame)}
            </span>
            <Slider
              value={[currentFrame]}
              max={TOTAL_FRAMES - 1}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground font-mono w-10 text-right">
              {formatTime(TOTAL_FRAMES)}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {meta?.generatedAt && (
                <span>
                  Generated: {new Date(meta.generatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Budget Agent",
            key: "budget",
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          },
          {
            label: "Savings Agent",
            key: "savings",
            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          },
          {
            label: "Debt Manager",
            key: "debt",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          },
          {
            label: "Investment Scout",
            key: "investment",
            color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
          },
        ].map((agent) => (
          <div
            key={agent.label}
            className={`text-center text-xs font-medium py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 ${agent.color}`}
          >
            {meta?.agentsAvailable?.[agent.key] ? (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
            ) : (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            )}
            {agent.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Default fallback data when API fails
function getDefaultData() {
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
  
  return {
    intro: {
      monthName,
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      headline: "Connect your profile to see personalized insights",
    },
    budget: {
      budgetCategories: [
        { name: "Food", percentUsed: 50 },
        { name: "Transport", percentUsed: 30 },
        { name: "Entertainment", percentUsed: 20 },
      ],
      budgetScore: 70,
      topOptimization: "Complete your profile to get budget recommendations",
    },
    savings: {
      monthlySavings: 0,
      savingsGoal: 10000,
      currentSavings: 0,
      savingsRate: 0,
      topSavingsTip: "Set up your income to track savings rate",
    },
    debt: {
      totalDebt: 0,
      monthlyPayment: 0,
      debts: [],
      strategy: "Add debts to get a personalized payoff strategy",
    },
    investment: {
      riskLevel: "Not Set",
      allocations: [
        { name: "Stocks", percentage: 40 },
        { name: "Bonds", percentage: 30 },
        { name: "ETFs", percentage: 20 },
        { name: "Cash", percentage: 10 },
      ],
      topPick: "Complete risk assessment in profile settings",
    },
    actionPlan: {
      actions: [
        "Complete your financial profile",
        "Add your monthly income",
        "Set up budget categories",
        "Define your savings goals",
      ],
    },
  };
}

export default CouncilSynthesis;
