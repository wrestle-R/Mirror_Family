import SceneWrapper from "../SceneWrapper";
import AnimatedText from "../AnimatedText";
import AnimatedBar from "../AnimatedBar";
import { SCENE_DURATIONS } from "../constants";

function BudgetScene({ data, colors }) {
  const categories = data?.budgetCategories || [];
  const budgetScore = data?.budgetScore || 0;
  const topOptimization = data?.topOptimization || "Review your spending habits";

  return (
    <SceneWrapper durationInFrames={SCENE_DURATIONS.budget}>
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <AnimatedText
          delay={3}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.info,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Budget Agent
        </AnimatedText>

        <AnimatedText
          delay={8}
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 28,
          }}
        >
          Budget Health: {budgetScore}/100
        </AnimatedText>

        <div style={{ marginBottom: 24 }}>
          {categories.slice(0, 3).map((cat, i) => (
            <AnimatedBar
              key={cat.name}
              label={cat.name}
              value={cat.percentUsed}
              maxValue={100}
              delay={15 + i * 10}
              colors={colors}
              color={
                cat.percentUsed > 90
                  ? colors.danger
                  : cat.percentUsed > 70
                    ? colors.warning
                    : colors.success
              }
            />
          ))}
        </div>

        <AnimatedText
          delay={50}
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            padding: "12px 16px",
            backgroundColor: colors.card,
            borderRadius: 8,
            borderLeft: `3px solid ${colors.info}`,
          }}
        >
          {topOptimization}
        </AnimatedText>
      </div>
    </SceneWrapper>
  );
}

export default BudgetScene;