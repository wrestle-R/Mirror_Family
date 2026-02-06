import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "./UserContext";

const SandboxContext = createContext();

export const useSandbox = () => useContext(SandboxContext);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const SandboxProvider = ({ children }) => {
  const { user } = useUser();
  const [isSandboxEnabled, setIsSandboxEnabled] = useState(false);
  const [viewMode, setViewMode] = useState("current"); // 'current' | 'optimized'
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // When Sandbox is enabled, ensure we have data
  useEffect(() => {
    if (isSandboxEnabled && !simulationData && user?.uid) {
      fetchSimulationData();
    }
  }, [isSandboxEnabled, user]);

  const fetchSimulationData = useCallback(async (forceRegenerate = false) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      let data = null;

      // 1. Try to get existing (unless forcing regenerate)
      if (!forceRegenerate) {
        const res = await axios.get(`${API_URL}/api/future/time-machine/${user.uid}`);
        data = res.data?.data;
        // Check if data has the new dashboardCards structure; if not, regenerate
        if (data && !data?.projections?.dashboardCards) {
          console.log("Time Machine: stale data without dashboardCards, regenerating...");
          data = null;
        }
      }

      // 2. Generate if no valid data
      if (!data) {
        toast.info("Powering up the Time Machine... Calculating 2036...");
        const res = await axios.post(`${API_URL}/api/future/time-machine/generate`, {
          firebaseUid: user.uid,
        });
        data = res.data?.data;
      }

      setSimulationData(data);
    } catch (error) {
      console.error("Time Machine Error:", error);
      toast.error("Could not activate Time Machine.");
      setIsSandboxEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const regenerate = useCallback(() => fetchSimulationData(true), [fetchSimulationData]);

  const toggleSandbox = () => {
    setIsSandboxEnabled((prev) => !prev);
    if (isSandboxEnabled) {
      setViewMode("current");
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "current" ? "optimized" : "current"));
  };

  return (
    <SandboxContext.Provider
      value={{
        isSandboxEnabled,
        viewMode,
        simulationData,
        loading,
        toggleSandbox,
        toggleViewMode,
        setLoading,
        regenerate,
        fetchSimulationData,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
};
