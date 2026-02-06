import { AbsoluteFill, Sequence } from "remotion";
import IntroScene from "./scenes/IntroScene";
import BudgetScene from "./scenes/BudgetScene";
import SavingsScene from "./scenes/SavingScene";
import DebtScene from "./scenes/DebtScene";
import InvestmentScene from "./scenes/InvestmentScene";
import ActionPlanScene from "./scenes/ActionPlanScene";
import {
  DARK_COLORS,
  SCENE_DURATIONS,
  SCENE_OFFSETS,
} from "./constants";

function CouncilSynthesisVideo({ data, colors = DARK_COLORS }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <Sequence
        from={SCENE_OFFSETS.intro}
        durationInFrames={SCENE_DURATIONS.intro}
        name="Intro"
      >
        <IntroScene data={data?.intro} colors={colors} />
      </Sequence>

      <Sequence
        from={SCENE_OFFSETS.budget}
        durationInFrames={SCENE_DURATIONS.budget}
        name="Budget"
      >
        <BudgetScene data={data?.budget} colors={colors} />
      </Sequence>

      <Sequence
        from={SCENE_OFFSETS.savings}
        durationInFrames={SCENE_DURATIONS.savings}
        name="Savings"
      >
        <SavingsScene data={data?.savings} colors={colors} />
      </Sequence>

      <Sequence
        from={SCENE_OFFSETS.debt}
        durationInFrames={SCENE_DURATIONS.debt}
        name="Debt"
      >
        <DebtScene data={data?.debt} colors={colors} />
      </Sequence>

      <Sequence
        from={SCENE_OFFSETS.investment}
        durationInFrames={SCENE_DURATIONS.investment}
        name="Investment"
      >
        <InvestmentScene data={data?.investment} colors={colors} />
      </Sequence>

      <Sequence
        from={SCENE_OFFSETS.actionPlan}
        durationInFrames={SCENE_DURATIONS.actionPlan}
        name="ActionPlan"
      >
        <ActionPlanScene data={data?.actionPlan} colors={colors} />
      </Sequence>
    </AbsoluteFill>
  );
}

export default CouncilSynthesisVideo;