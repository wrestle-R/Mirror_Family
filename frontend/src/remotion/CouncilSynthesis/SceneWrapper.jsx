import { useCurrentFrame, interpolate, Easing } from "remotion";

function SceneWrapper({ children, durationInFrames }) {
  const frame = useCurrentFrame();

  const FADE_DURATION = 15;

  const enterOpacity = interpolate(frame, [0, FADE_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - FADE_DURATION, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  const opacity = Math.min(enterOpacity, exitOpacity);

  const enterTranslateY = interpolate(frame, [0, FADE_DURATION], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const exitTranslateY = interpolate(
    frame,
    [durationInFrames - FADE_DURATION, durationInFrames],
    [0, -20],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  const translateY =
    frame < FADE_DURATION
      ? enterTranslateY
      : frame > durationInFrames - FADE_DURATION
        ? exitTranslateY
        : 0;

  const scale = interpolate(frame, [0, FADE_DURATION], [0.97, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${frame < FADE_DURATION ? scale : 1})`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export default SceneWrapper;