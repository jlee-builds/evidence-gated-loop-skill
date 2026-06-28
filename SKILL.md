---
name: evidence-gated-loop
description: Evidence-backed loop workflow for large repair, validation, and closure tasks. Use when the user asks for loop engineering, plan, review-work, repair, and review-work cycles, artifact-backed final approval, multi-agent review gates, strict QA closure, no report-only verdicts, or wants a reusable pattern that keeps cycling until review-work lanes are stable with zero open objections or an exact external blocker is proven.
---

# Evidence-Gated Loop

Use this skill to run a task as a closed repair loop, not as a one-shot report. The loop ends only when current artifacts pass hard gates and review-work stays clean after repair, or when a specific external blocker is proven.

## Core Rule

Do not stop at “reloop required” if the remaining work is repairable. Convert each finding into a repair action, apply the smallest safe repair, rerun validation, run review-work again, then repeat until review-work has no objections.

## Required Cycle

Always treat review-work as a gate that can reopen the loop:

```text
freeze -> repair -> validator/browser QA -> review-work
   ^                                      |
   |                                      v
   +-------- finding register <- objection
```

- `review-work` PASS is not final until the aggregate packet is regenerated from the latest evidence.
- Any `review-work` FAIL, REJECT, INCONCLUSIVE, timeout, or missing artifact becomes a finding.
- Every finding must become either `repaired`, `superseded_by_current_evidence`, or `blocked_by_exact_external_reason`.
- After any repair or aggregate regeneration, rerun the affected review-work lane.
- Finish only after the final review-work pass, not before it.

## Workflow

1. **Freeze**
   - Read the user request, plan file, current artifacts, and protected-file rules.
   - Record current hashes for files that must not drift.
   - Decide the allowed write scope before editing.

2. **Extract Findings**
   - Treat prior FAIL/REJECT/review-work results as inputs, not noise.
   - Build a finding register with: `id`, `evidence`, `affected_artifact`, `repair_action`, `status`.
   - Ignore no finding unless current evidence proves it stale; then mark it `superseded_by_current_evidence`.

3. **Repair**
   - Fix concrete causes, not report symptoms.
   - Prefer existing validators, adapters, and project scripts.
   - If the task is planning-only, repair the plan/contract/evidence, not product files.
   - If the task is implementation, patch only the allowed surface.

4. **Validate**
   - Run the smallest existing validators that cover the changed path.
   - For UI, run browser/DOM/visual QA on the real page and relevant modes/viewports.
   - For data/source work, validate accessibility, source universe, replacement decisions, and hidden/selected/excluded buckets.
   - Negative fixtures must fail. Notification-only checks do not count.

5. **Review Lanes**
   - Use independent lanes when available: `goal`, `qa`, `code`, `security`, `context`.
   - Each lane must write durable `.md` and `.json` artifacts.
   - A lane passes only with `verdict: PASS` and `open_objections: []`.
   - If subagents are unavailable, perform the same lanes sequentially and write the same artifacts.
   - If any lane fails, do not write a final-ready report. Add the objection to the finding register and return to **Repair**.

6. **Reconcile**
   - Regenerate final aggregate files after the latest validators and review lanes.
   - Old FAIL artifacts must be resolved, superseded, or remain open. Do not bury them.
   - If a lane fails because the aggregate is stale, regenerate the aggregate and rerun that lane.
   - After reconciliation, rerun at least the lane that raised the stale/reconciliation objection.
   - Before writing review artifacts, redact or summarize secrets, credentials, private payloads, PII, auth headers, cookies, and sensitive logs. Record only bounded evidence, hashes, counts, and short non-sensitive identifiers.

7. **Stop Condition**
   - Stop at `*_ready_for_user_review` or the user-specified ready state only when all hard gates pass and open objections are 0.
   - Stop at `*_blocked_by_<exact_reason>` only for a real external blocker: missing credentials, unavailable source, impossible protected-file constraint, or user input that cannot be inferred.
   - Never claim commercial proof, final model quality, or production readiness unless the user explicitly asked for that gate and the evidence supports it.

## Final Packet

Write or update the smallest useful packet:

- `final-report.md`
- `final-report.json`
- `finding-register.json`
- validator logs or JSON
- browser/visual QA evidence when UI changed
- protected hash check when protected files exist

Final JSON should include:

```json
{
  "status": "ready_status",
  "pass": true,
  "exact_external_blocker": null,
  "open_objection_count": 0,
  "lane_status": {
    "goal": {"verdict": "PASS", "open_objections": []},
    "qa": {"verdict": "PASS", "open_objections": []},
    "code": {"verdict": "PASS", "open_objections": []},
    "security": {"verdict": "PASS", "open_objections": []},
    "context": {"verdict": "PASS", "open_objections": []}
  },
  "claim_boundary": "What this result does and does not prove."
}
```

For a blocked packet, set `pass` to `false`, include `exact_external_blocker`, and do not use a ready status. A blocked result may be useful evidence, but it is not a pass.

## Anti-Patterns

- Report-only “needs reloop” verdict.
- Fresh PASS while old FAIL artifacts remain unreconciled.
- Final-ready report before a post-repair review-work pass.
- Treating validator pass as enough when review-work has not rerun.
- QA that clicks or mutates the UI into a false failure.
- Regex scans that flag normal source text as internal metadata.
- Final report written before the latest validators and review lanes.
- Protected file drift without explicit user approval.
