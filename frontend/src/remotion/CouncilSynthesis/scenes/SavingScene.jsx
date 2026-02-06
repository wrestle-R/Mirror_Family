import { useCurrentFrame, interpolate, Easing } from "remotion";
import SceneWrapper from "../SceneWrapper";
import AnimatedText from "../AnimatedText";
import { SCENE_DURATIONS } from "../constants";

function SavingsScene({ data, colors }) {
  const frame = useCurrentFrame();
  const monthlySavings = data?.monthlySavings || 0;
  const savingsGoal = data?.savingsGoal || 0;
  const currentSavings = data?.currentSavings || 0;
  const savingsRate = data?.savingsRate || 0;
  const topTip = data?.topSavingsTip || "Automate your savings transfers";

  const circleProgress = interpolate(frame, [15, 60], [0, savingsRate], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset =
    circumference - (circleProgress / 100) * circumference;

  const displayRate = interpolate(frame, [15, 60], [0, savingsRate], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <SceneWrapper durationInFrames={SCENE_DURATIONS.savings}>
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
            color: colors.success,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Savings Agent
        </AnimatedText>

        <AnimatedText
          delay={8}
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 32,
          }}
        >
          Savings Plan
        </AnimatedText>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            marginBottom: 28,
          }}
        >
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke={colors.cardBorder}
                strokeWidth="10"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke={colors.success}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                {Math.round(displayRate)}%
              </div>
              <div
                style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}
              >
                savings rate
              </div>
            </div>
          </div>

          <div>
            <AnimatedText
              delay={20}
              style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 12 }}
            >
              Monthly savings:{" "}
              <span style={{ color: colors.success, fontWeight: 600 }}>
                Rs.{monthlySavings.toLocaleString("en-IN")}
              </span>
            </AnimatedText>
            <AnimatedText
              delay={28}
              style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 12 }}
            >
              Current savings:{" "}
              <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                Rs.{currentSavings.toLocaleString("en-IN")}
              </span>
            </AnimatedText>
            <AnimatedText
              delay={34}
              style={{ fontSize: 16, color: colors.textSecondary }}
            >
              Goal:{" "}
              <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                Rs.{savingsGoal.toLocaleString("en-IN")}
              </span>
            </AnimatedText>
          </div>
        </div>

        <AnimatedText
          delay={45}
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            padding: "12px 16px",
            backgroundColor: colors.card,
            borderRadius: 8,
            borderLeft: `3px solid ${colors.success}`,
            width: "100%",
            maxWidth: 500,
          }}
        >
          {topTip}
        </AnimatedText>
      </div>
    </SceneWrapper>
  );
}

export default SavingsScene;