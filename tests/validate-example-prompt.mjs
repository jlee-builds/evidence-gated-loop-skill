#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = resolve(repoRoot, "README.md");
const readme = readFileSync(readmePath, "utf8");

function extractExamplePrompt(markdown) {
  const heading = "## Example Prompt";
  const start = markdown.indexOf(heading);
  if (start === -1) {
    return null;
  }

  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const fenceMatch = section.match(/```text\n([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : null;
}

const requiredChecks = [
  {
    id: "binding-universe-and-protected-scope",
    reason: "the prompt must bind the task universe before repair starts",
    patterns: [
      /\b(binding universe|authoritative baseline|source of truth)\b/i,
      /\ballowed write scope\b/i,
      /\bprotected files?\b/i,
      /\b(freeze|record) (current )?(hashes|baseline)\b/i,
    ],
  },
  {
    id: "prior-failure-evidence-is-input",
    reason: "old failure artifacts must reopen the loop instead of being buried",
    patterns: [
      /\bFAIL\b/,
      /\bREJECT\b/,
      /\bINCONCLUSIVE\b/,
      /\b(timeout|missing artifact)\b/i,
      /\bfinding register\b/i,
    ],
  },
  {
    id: "repairable-findings-become-actions",
    reason: "review-work findings must become repair work, not a report-only verdict",
    patterns: [
      /\brepair actions?\b/i,
      /\b(smallest safe repair|repair the candidate|repair the artifact)\b/i,
      /\b(repaired|superseded_by_current_evidence|blocked_by_exact_external_reason)\b/,
      /\breport-only\b/i,
    ],
  },
  {
    id: "negative-fixtures-and-real-surface-evidence",
    reason: "validators must include negative and real-surface evidence",
    patterns: [
      /\bvalidators?\b/i,
      /\bnegative fixtures?\b/i,
      /\b(real-surface|browser QA|DOM|visible payload)\b/i,
      /\b(current artifacts?|latest artifacts?)\b/i,
    ],
  },
  {
    id: "five-review-lanes",
    reason: "the example must preserve the multi-lane review-work gate",
    patterns: [
      /\breview-work lanes?\b/i,
      /\bgoal\b/i,
      /\bqa\b/i,
      /\bcode\b/i,
      /\bsecurity\b/i,
      /\bcontext\b/i,
      /\bopen_objections\b/,
    ],
  },
  {
    id: "post-repair-rerun",
    reason: "a repaired candidate is not ready until affected gates rerun",
    patterns: [
      /\brerun\b/i,
      /\bafter (any )?repair\b/i,
      /\baffected review-work lanes?\b/i,
      /\brepeat\b/i,
    ],
  },
  {
    id: "latest-final-packet",
    reason: "final readiness must be regenerated from latest evidence",
    patterns: [
      /\bregenerate\b/i,
      /\bfinal packet\b/i,
      /\blatest evidence\b/i,
      /\bfinal-report\.json\b/,
      /\bfinding-register\.json\b/,
    ],
  },
  {
    id: "strict-stop-condition",
    reason: "the loop can stop only at ready/open-zero or exact blocker",
    patterns: [
      /\bready_for_user_review\b/,
      /\bopen_objection_count\b/,
      /\bzero open objections\b/i,
      /\bexact_external_blocker\b/,
      /\bblocked_by_exact_external_reason\b/,
    ],
  },
  {
    id: "claim-boundary",
    reason: "the final packet must not overclaim beyond the evidence",
    patterns: [
      /\bclaim boundary\b/i,
      /\bdoes and does not prove\b/i,
      /\b(parent|production|commercial|model quality|protected)\b/i,
    ],
  },
];

const weakPromptFixture = `
[$evidence-gated-loop] Continue from the current workspace.
Freeze current hashes first.
Do not modify protected files unless explicitly allowed.
Convert every review-work finding into a repair action.
Run validators and stop at ready_for_user_review.
`;

function evaluatePrompt(prompt) {
  return requiredChecks
    .filter((check) => check.patterns.some((pattern) => !pattern.test(prompt)))
    .map((check) => ({
      id: check.id,
      reason: check.reason,
      missingPatterns: check.patterns
        .filter((pattern) => !pattern.test(prompt))
        .map((pattern) => pattern.toString()),
    }));
}

const examplePrompt = extractExamplePrompt(readme);
const failures = [];

if (!examplePrompt) {
  failures.push({
    id: "example-prompt-section",
    reason: "README.md must contain a fenced text block under ## Example Prompt.",
  });
} else {
  failures.push(...evaluatePrompt(examplePrompt));
}

const weakFixtureFailures = evaluatePrompt(weakPromptFixture);
if (weakFixtureFailures.length < 5) {
  failures.push({
    id: "weak-fixture-negative-control",
    reason: "The validator must reject weak report-only loop prompts.",
    observedFailureCount: weakFixtureFailures.length,
  });
}

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "fail",
        checkedFile: readmePath,
        failureCount: failures.length,
        failures,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      checkedFile: readmePath,
      checkCount: requiredChecks.length,
      negativeControlFailures: weakFixtureFailures.length,
    },
    null,
    2,
  ),
);
