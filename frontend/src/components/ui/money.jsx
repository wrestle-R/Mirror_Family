import { useStealth } from "@/context/StealthContext";
import { cn } from "@/lib/utils";

/**
 * A component that wraps monetary values and blurs them when stealth mode is enabled.
 * Usage: <Money>₹{value.toLocaleString()}</Money>
 */
export function Money({ children, className }) {
  const { stealthMode } = useStealth();

  return (
    <span
      className={cn(
        "transition-all duration-200",
        stealthMode && "blur-md select-none",
        className
      )}
    >
      {children}
    </span>
  );
}
