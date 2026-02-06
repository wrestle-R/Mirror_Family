import { createContext, useContext, useState, useEffect } from "react";

const StealthContext = createContext(undefined);

export function StealthProvider({ children }) {
  const [stealthMode, setStealthMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("stealthMode");
      return stored === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("stealthMode", stealthMode);
  }, [stealthMode]);

  const toggleStealth = () => {
    setStealthMode((prev) => !prev);
  };

  return (
    <StealthContext.Provider value={{ stealthMode, setStealthMode, toggleStealth }}>
      {children}
    </StealthContext.Provider>
  );
}

export function useStealth() {
  const context = useContext(StealthContext);
  if (context === undefined) {
    throw new Error("useStealth must be used within a StealthProvider");
  }
  return context;
}
