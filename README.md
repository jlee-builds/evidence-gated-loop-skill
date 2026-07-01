# Evidence-Gated Loop

![Evidence-Gated Loop banner](./assets/evidence-gated-loop-banner.png)

Evidence-Gated Loop is a Codex skill for repair work that must be closed by evidence, not by a confident summary.

The executable skill is [`SKILL.md`](./SKILL.md). This README is the public introduction: what the skill is for, how to install it, and what kind of result it is meant to produce.

## What It Solves

Agentic work often fails after the first review:

- a validator passes, but the actual user-facing result is still weak
- a review says "reloop required", but no repair happens
- old FAIL artifacts are buried under a new PASS report
- protected files drift while the final summary still claims readiness
- review-work is treated as commentary instead of a gate

Evidence-Gated Loop turns those failures into an explicit loop:

```text
freeze -> repair -> validate -> review-work
   ^                              |
   |                              v
   +------ finding register <- objection
```

The loop ends only when the latest artifacts pass the hard gates with zero open objections, or when a precise external blocker is proven.

## Core Principle

Every finding must become one of these:

- `repaired`
- `superseded_by_current_evidence`
- `blocked_by_exact_external_reason`

Anything else keeps the loop open.

## When To Use

Use this skill for:

- plan -> review-work -> repair loops
- strict QA closure
- UI or content repairs that need browser evidence
- data, source, or recommender handoff validation
- protected-file workflows where drift must be detected
- multi-agent review gates where every lane must pass

Skip it for tiny one-off edits where one direct check is enough.

## What The Skill Enforces

- Freeze the current baseline before repair.
- Record protected-file hashes when relevant.
- Convert review objections into tracked repair actions.
- Use current validators, browser QA, source checks, or other real-surface evidence.
- Treat review-work FAIL, REJECT, INCONCLUSIVE, timeout, or missing artifacts as non-pass.
- Regenerate the final packet only after the latest repair and review evidence.
- Avoid report-only closure.

## Install

Clone the repository and copy the skill into your Codex skills directory:

```sh
git clone https://github.com/jlee-oss/evidence-gated-loop-skill.git
mkdir -p "$HOME/.codex/skills/evidence-gated-loop"
cp -R evidence-gated-loop-skill/SKILL.md evidence-gated-loop-skill/agents "$HOME/.codex/skills/evidence-gated-loop/"
```

Restart Codex or reload skills if your environment requires it.

## Example Prompt

Use this as a copyable contract, then fill the angle-bracket fields for the project you are repairing:

```text
[$evidence-gated-loop] Run a closed evidence-gated loop for <work item>.

Binding universe:
- Treat <baseline artifact, apply contract, or source manifest> as the source of truth and binding universe.
- Freeze current hashes and record the authoritative baseline before editing.
- Allowed write scope: <paths that may change>.
- Protected files: <paths that must not change>; do not modify them unless the user explicitly expands scope.
- Current artifacts: <candidate paths, validator outputs, UI surfaces, or payloads that must be judged>.

Existing evidence:
- Treat every prior FAIL, REJECT, INCONCLUSIVE, timeout, or missing artifact as an input, not noise.
- Build finding register entries with evidence, affected artifact, repair action, and status.
- Apply the smallest safe repair for each concrete cause.
- Each finding must become repaired, superseded_by_current_evidence, or blocked_by_exact_external_reason.
- Do not close with a report-only "needs reloop" verdict while any repairable finding remains.

Hard gates:
- Run validators against the latest artifacts.
- Include negative fixtures for known bad outputs and prove they fail.
- Run real-surface, browser QA, DOM, or visible payload scans when the user-facing surface can differ from files.
- Reject fallback copy, generic templates, inaccessible selected sources, exposed internal metadata, duplicate same-purpose rows, and unfinished snippets when those risks apply.

Review-work:
- Run review-work lanes: goal, qa, code, security, context.
- A lane passes only with verdict PASS and open_objections: [].
- After any repair, rerun affected review-work lanes and repeat until all open objections are resolved.

Stop conditions:
- Regenerate the final packet only from latest evidence after validators, real-surface checks, and review-work finish.
- Stop at ready_for_user_review only when pass is true, open_objection_count is 0, and there are zero open objections.
- Stop at blocked_by_exact_external_reason only when exact_external_blocker names a real external blocker.
- The claim boundary must state what this result does and does not prove, including any protected, parent, production, commercial, or model quality limits.

Required artifacts:
- final-report.md
- final-report.json
- finding-register.json
- validator, negative-fixture, real-surface, protected-hash, and review-work evidence
```

## Test Bed

This repository includes a small README-surface validator for the example prompt:

```sh
node tests/validate-example-prompt.mjs
```

The validator extracts the fenced prompt under `## Example Prompt`, checks for the loop contract above, and keeps a weak prompt as a negative control. It is intentionally narrow: it does not prove that every future agent will obey the prompt, but it prevents this public example from regressing into a report-only or validator-only loop.

## Expected Final Packet

A successful run should leave a small, inspectable packet:

```text
final-report.md
final-report.json
finding-register.json
validator or QA evidence
protected hash check, when protected files exist
```

A useful `final-report.json` should make the claim boundary explicit:

```json
{
  "status": "ready_for_user_review",
  "pass": true,
  "exact_external_blocker": null,
  "open_objection_count": 0,
  "lane_status": {
    "goal": { "verdict": "PASS", "open_objections": [] },
    "qa": { "verdict": "PASS", "open_objections": [] },
    "code": { "verdict": "PASS", "open_objections": [] },
    "security": { "verdict": "PASS", "open_objections": [] },
    "context": { "verdict": "PASS", "open_objections": [] }
  },
  "claim_boundary": "What this result does and does not prove."
}
```

## What This Does Not Prove

This skill does not automatically prove commercial readiness, production safety, model quality, or product-market fitness. It enforces evidence discipline: current claims must match current artifacts, unresolved objections must remain visible, and repairable failures cannot be closed as a report-only verdict.

## Repository Layout

```text
README.md
SKILL.md
LICENSE
agents/openai.yaml
tests/validate-example-prompt.mjs
```

## License

MIT. See [`LICENSE`](./LICENSE).
