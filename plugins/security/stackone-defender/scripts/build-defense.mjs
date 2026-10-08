/**
 * Builds the daemon's PromptDefense.
 *
 * When the Tier 2 model or ONNX runtime fails to load, @stackone/defender allows every
 * result and only warns on the console, which the daemon's ignored stdio swallows. With
 * Tier 1 off in the shipped config that would scan nothing, so fall back to Tier 1
 * patterns and report the degraded state to the caller.
 */
export async function buildDefense(PromptDefense, options, log) {
  const defense = new PromptDefense(options);
  await defense.warmupTier2();
  if (defense.isTier2Ready()) return { defense, tier2Ready: true };

  log("Tier 2 unavailable, falling back to Tier 1 patterns");
  // Tier 1 only reads fields with "risky" names (description, body, text...), and the hook
  // wraps plain tool output as { output }, so widen it to every field or it scans nothing.
  const fallback = new PromptDefense({
    ...options,
    enableTier1: true,
    enableTier2: false,
    config: { ...options.config, riskyFields: { fieldNames: [], fieldPatterns: [/./] } },
  });
  return { defense: fallback, tier2Ready: false };
}
