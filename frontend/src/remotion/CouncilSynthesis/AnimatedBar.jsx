import { useCurrentFrame, interpolate, Easing } from "remotion";

function AnimatedBar({
  label,
  value,
  maxValue = 100,
  delay = 0,
  color = "#f5f5f5",
  suffix = "%",
  colors,
}) {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const width = interpolate(
    frame,
    [delay + 5, delay + 25],
    [0, (value / maxValue) * 100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const displayValue = interpolate(
    frame,
    [delay + 5, delay + 25],
    [0, value],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <div style={{ opacity, marginBottom: 14, width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontSize: 16,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ color: colors.textSecondary }}>
          {suffix === "Rs."
            ? `Rs.${Math.round(displayValue).toLocaleString("en-IN")}`
            : `${Math.round(displayValue)}${suffix}`}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.cardBorder,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          }}
        />
      </div>
    </div>
  );
}

export default AnimatedBar;