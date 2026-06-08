# StackOne Defender 2.5.0 — Release Notes

**Released**: 2026-05-12

## Highlights

- Multi-head Tier 2 classifier with aux-veto rescue rule
- Recovers ~30% of false positives on customer-message and LMS content
- New `tier2Config.multihead` API for callers that want decision-rule scoring

## Breaking changes

None. The multi-head path is opt-in via `multihead: { mainThreshold, auxThreshold }`.
Existing single-head deployments are unaffected.

## Security fixes

- **CVE-2026-pending**: An attacker who could place text inside tool-result
  payloads could induce the agent to disregard prior instructions and call
  arbitrary tools. The fix adds wrapped-attack supervision to the Tier 2
  model. See `2026-05-12-multihead-v4-ablation.md` for full evaluation.

## Known issues

- LMS multi-record blobs (six or more records concatenated) may still trigger
  a false-positive block under v4c. Per-record passes; the regression appears
  only when the full blob is scored as a single chunk.
- JSON list payloads with five or more entries may trigger main-head false
  positives. Workaround: enable `useSfe: true` to drop list-shaped fields
  before classification.

## Threshold guidance

| Use case | mainThreshold | auxThreshold |
|---|---|---|
| Default (production) | 0.5 | 0.3 |
| Stricter (lower FPR) | 0.7 | 0.3 |
| Very strict | 0.8 | 0.2 |

## Upgrade

```
npm install @stackone/defender@2.5.0
```

No code changes required for single-head users.
