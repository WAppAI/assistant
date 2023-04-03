const VALID_TONES = ["creative", "balanced", "precise"] as const;
type Tone = typeof VALID_TONES[number];

// for now, config/toneStyle is shared to every conversation
let toneStyle: Tone = "creative";

export const config = {
  toneStyle,
  VALID_TONES
};
