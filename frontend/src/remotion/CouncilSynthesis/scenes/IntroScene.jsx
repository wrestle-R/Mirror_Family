import { useCurrentFrame, interpolate, Easing } from "remotion";
import SceneWrapper from "../SceneWrapper";
import AnimatedText from "../AnimatedText";
import { SCENE_DURATIONS } from "../constants";

function IntroScene({ data, colors }) {
  const frame = useCurrentFrame();
  const monthName = data?.monthName || "This Month";
  const totalIncome = data?.totalIncome || 0;
  const totalExpenses = data?.totalExpenses || 0;
  const netSavings = data?.netSavings || Math.max(0, totalIncome - totalExpenses);
  const headline = data?.headline || "Your monthly financial briefing";

  const lineWidth = interpolate(frame, [20, 50], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <SceneWrapper durationInFrames={SCENE_DURATIONS.intro}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <AnimatedText
          delay={5}
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: colors.chart1,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Money Council
        </AnimatedText>

        <AnimatedText
          delay={12}
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {monthName} Briefing
        </AnimatedText>

        <div
          style={{
            width: lineWidth,
            height: 3,
            backgroundColor: colors.primary,
            borderRadius: 2,
            margin: "16px 0",
          }}
        />

        <AnimatedText
          delay={25}
          style={{
            fontSize: 18,
            color: colors.textSecondary,
            marginTop: 8,
          }}
        >
          Income: Rs.{totalIncome.toLocaleString("en-IN")} · Expenses: Rs.{totalExpenses.toLocaleString("en-IN")}
        </AnimatedText>

        <AnimatedText
          delay={32}
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: netSavings >= 0 ? colors.success : colors.danger,
            marginTop: 12,
          }}
        >
          Net: {netSavings >= 0 ? "+" : ""}Rs.{netSavings.toLocaleString("en-IN")}
        </AnimatedText>

        <AnimatedText
          delay={40}
          style={{
            fontSize: 15,
            color: colors.textMuted,
            marginTop: 20,
            fontStyle: "italic",
          }}
        >
          {headline}
        </AnimatedText>
      </div>
    </SceneWrapper>
  );
}

export default IntroScene;