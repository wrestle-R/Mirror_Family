import { useCurrentFrame, interpolate, Easing } from "remotion";
import SceneWrapper from "../SceneWrapper";
import AnimatedText from "../AnimatedText";
import { SCENE_DURATIONS } from "../constants";

function InvestmentScene({ data, colors }) {
  const frame = useCurrentFrame();
  const riskLevel = data?.riskLevel || "Moderate";
  const allocations = data?.allocations || [];
  const topPick = data?.topPick || "Diversify across asset classes";

  return (
    <SceneWrapper durationInFrames={SCENE_DURATIONS.investment}>
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AnimatedText
          delay={3}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.chart3,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Investment Scout
        </AnimatedText>

        <AnimatedText
          delay={8}
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 8,
          }}
        >
          Investment Direction
        </AnimatedText>

        <AnimatedText
          delay={14}
          style={{
            fontSize: 17,
            color: colors.textSecondary,
            marginBottom: 32,
          }}
        >
          Risk Profile:{" "}
          <span style={{ color: colors.chart3, fontWeight: 600 }}>
            {riskLevel}
          </span>
        </AnimatedText>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {allocations.slice(0, 4).map((alloc, i) => {
            const cardOpacity = interpolate(
              frame,
              [18 + i * 8, 28 + i * 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const cardScale = interpolate(
              frame,
              [18 + i * 8, 28 + i * 8],
              [0.9, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            return (
              <div
                key={alloc.name}
                style={{
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 12,
                  padding: "16px 24px",
                  textAlign: "center",
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: colors.chart3,
                    marginBottom: 4,
                  }}
                >
                  {alloc.percentage}%
                </div>
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {alloc.name}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatedText
          delay={55}
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            padding: "12px 16px",
            backgroundColor: colors.card,
            borderRadius: 8,
            borderLeft: `3px solid ${colors.chart3}`,
            maxWidth: 500,
            width: "100%",
          }}
        >
          {topPick}
        </AnimatedText>
      </div>
    </SceneWrapper>
  );
}

export default InvestmentScene;