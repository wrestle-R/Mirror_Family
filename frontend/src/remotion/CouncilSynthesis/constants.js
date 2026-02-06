export const FPS = 30;
export const TOTAL_DURATION_SECONDS = 30;
export const TOTAL_FRAMES = FPS * TOTAL_DURATION_SECONDS; // 900 frames

export const SCENE_DURATIONS = {
  intro: 5 * FPS,        // 150 frames (0-4.99s)
  budget: 5 * FPS,       // 150 frames (5-9.99s)
  savings: 5 * FPS,      // 150 frames (10-14.99s)
  debt: 5 * FPS,         // 150 frames (15-19.99s)
  investment: 5 * FPS,   // 150 frames (20-24.99s)
  actionPlan: 5 * FPS,   // 150 frames (25-29.99s)
};

export const SCENE_OFFSETS = {
  intro: 0,
  budget: 150,
  savings: 300,
  debt: 450,
  investment: 600,
  actionPlan: 750,
};

// Theme-aware colors matching index.css oklch values
// Dark theme (default for video - matches .dark block)
export const DARK_COLORS = {
  background: "#1f1f1f",    // oklch(0.1324 0 0) 
  card: "#2b2b2b",          // oklch(0.1815 0 0) 
  cardBorder: "#3b3b3b",    // oklch(0.2591 0 0) 
  secondary: "#363636",     // oklch(0.2376 0 0) 
  primary: "#f5f5f5",       // oklch(0.9848 0 0) 
  primaryForeground: "#303030", // oklch(0.2044 0 0)
  muted: "#363636",         // oklch(0.2376 0 0)
  mutedForeground: "#a3a3a3", // oklch(0.7079 0 0) 
  accent: "#363636",        // oklch(0.2376 0 0)
  textPrimary: "#f5f5f5",   // oklch(0.9848 0 0)
  textSecondary: "#a3a3a3", // oklch(0.7079 0 0)
  textMuted: "#737373",     // ~ muted-foreground slightly dimmed
  chart1: "#4ade80",        // oklch(0.7205 0.1920 149.4926) green
  chart2: "#f5f5f5",        // oklch(0.9848 0 0) white
  chart3: "#3b82a6",        // oklch(0.3787 0.0440 225.5393) blue
  chart4: "#eab308",        // oklch(0.8336 0.1186 88.1463) yellow
  chart5: "#f59e0b",        // oklch(0.7834 0.1261 58.7491) amber
  // Semantic colors
  success: "#4ade80",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
};

// Light theme (matches :root block)
export const LIGHT_COLORS = {
  background: "#ffffff",    // oklch(1.0 0 0)
  card: "#ffffff",          // oklch(1.0 0 0)
  cardBorder: "#e5e5e5",    // oklch(0.9197 0 0)
  secondary: "#f5f5f5",     // oklch(0.9676 0 0)
  primary: "#1a1a2e",       // oklch(0.2103 0.0059 285)
  primaryForeground: "#fafafa", // oklch(0.9848 0 0)
  muted: "#f5f5f5",         // oklch(0.9676 0 0)
  mutedForeground: "#737373", // oklch(0.5519 0.0137 285)
  accent: "#f5f5f5",
  textPrimary: "#1a1a2e",   // oklch(0.1405 0 285) 
  textSecondary: "#737373", // oklch(0.5519 0.0137 285)
  textMuted: "#a3a3a3",     // lighter muted
  chart1: "#4ade80",
  chart2: "#1a1a2e",
  chart3: "#3b82a6",
  chart4: "#eab308",
  chart5: "#f59e0b",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
};

// Default export for backward compat - dark by default
export const COLORS = DARK_COLORS;