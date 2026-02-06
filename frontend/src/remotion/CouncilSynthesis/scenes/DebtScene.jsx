import SceneWrapper from "../SceneWrapper";
import AnimatedText from "../AnimatedText";
import AnimatedBar from "../AnimatedBar";
import { SCENE_DURATIONS } from "../constants";

function DebtScene({ data, colors }) {
  const totalDebt = data?.totalDebt || 0;
  const monthlyPayment = data?.monthlyPayment || 0;
  const debts = data?.debts || [];
  const strategy = data?.strategy || "Stay consistent with payments";

  return (
    <SceneWrapper durationInFrames={SCENE_DURATIONS.debt}>
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
            color: colors.warning,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Debt Manager
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
          Debt Overview
        </AnimatedText>

        <AnimatedText
          delay={14}
          style={{
            fontSize: 18,
            color: colors.textSecondary,
            marginBottom: 28,
          }}
        >
          Total: Rs.{totalDebt.toLocaleString("en-IN")} · Monthly payment: Rs.{monthlyPayment.toLocaleString("en-IN")}
        </AnimatedText>

        <div style={{ marginBottom: 24 }}>
          {debts.slice(0, 3).map((debt, i) => (
            <AnimatedBar
              key={debt.name}
              label={debt.name}
              value={debt.balance}
              maxValue={Math.max(...debts.map((d) => d.balance), 1)}
              delay={20 + i * 10}
              color={colors.warning}
              suffix="Rs."
              colors={colors}
            />
          ))}
        </div>

        <AnimatedText
          delay={55}
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            padding: "12px 16px",
            backgroundColor: colors.card,
            borderRadius: 8,
            borderLeft: `3px solid ${colors.warning}`,
          }}
        >
          {strategy}
        </AnimatedText>
      </div>
    </SceneWrapper>
  );
}

export default DebtScene;