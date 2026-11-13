export const glitchDefaults = { amount: 1, duration: 252, interval: 4200 };

export interface GlitchBurst { start: number; duration: number; amount?: number; }
export interface GlitchOptions { amount?: number; duration?: number; }

/** Pure timing calculation shared by automatic and externally triggered bursts. */
export const glitchOffset = (
  time: number,
  settings: { amount?: number; duration?: number; interval?: number; auto?: boolean },
  burst: GlitchBurst | null,
  calm: boolean,
) => {
  if (calm) return 0;
  const duration = Math.max(0, settings.duration ?? glitchDefaults.duration);
  const interval = Math.max(1, settings.interval ?? glitchDefaults.interval);
  const manual = burst !== null && time >= burst.start && time < burst.start + burst.duration;
  const automatic = (settings.auto ?? true) && duration > 0 && time % interval >= Math.max(0, interval - duration);
  const amount = (manual ? burst?.amount : undefined) ?? settings.amount ?? glitchDefaults.amount;
  return (manual || automatic) && amount > 0 ? Math.sin(time * 0.9) * 8 * amount : 0;
};
