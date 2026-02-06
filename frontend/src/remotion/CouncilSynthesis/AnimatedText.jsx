import { useCurrentFrame, interpolate, Easing } from "remotion";

function AnimatedText({ children, delay = 0, style = {}, as = "div" }) {
  const frame = useCurrentFrame();
  const Tag = as;

  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const translateY = interpolate(frame, [delay, delay + 12], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <Tag
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export default AnimatedText;