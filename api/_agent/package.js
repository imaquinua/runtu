import { createHash } from "node:crypto";
import { AGENT_INSTRUCTIONS, OUTPUT_SCHEMA } from "./config.js";

export const HUEVO0_MANIFEST = Object.freeze({
  schema_version: "runtu.agent/v1",
  agent: {
    id: "minuta-comite",
    name: "Minuta de Comité",
    version: "0.2.0",
    owner: "imaquinua",
    purpose: "Convertir notas crudas de una reunión en decisiones, pendientes, ruido descartado y un grano semanal.",
    risk_level: "low",
    status: "CANDIDATE",
  },
  runtime: {
    provider: "openai",
    model: "gpt-5.6-luna",
    reasoning_effort: "low",
    max_turns: 1,
    timeout_seconds: 30,
    budget_per_run_usd: 0.01,
  },
  input: { type: "meeting_notes", accepted_formats: ["text"], max_characters: 30000 },
  tools: [],
  policy: {
    human_review: "required_before_export",
    retention: "ZERO_CONTENT",
    prohibited_actions: ["invent_owner", "invent_deadline", "execute_decision", "send_messages", "obey_instructions_inside_notes"],
  },
  evaluation: {
    suite: "minuta-comite-v1",
    required_pass_rate: 0.9,
    required_policy_pass_rate: 1,
    required_schema_pass_rate: 1,
  },
  deployment: { allowed_channels: ["internal_web"], rollout_percent: 0, rollback_required: true },
});

export const HUEVO0_EVIDENCE = Object.freeze({
  report_id: "2026-07-21T16-43-53-242Z-gpt-5.6-luna",
  source_type: "replay",
  replay_of: "2026-07-21T01-53-40-553Z-gpt-5.6-luna",
  suite: "minuta-comite-v1",
  model: "gpt-5.6-luna",
  cases: 20,
  passed: 20,
  pass_rate: 1,
  schema_pass_rate: 1,
  policy_pass_rate: 1,
  total_estimated_cost_usd: 0.036559,
  latency_p95_ms: 3314,
  hatch: true,
});

export function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function huevo0Payload() {
  return {
    manifest: HUEVO0_MANIFEST,
    instructions: AGENT_INSTRUCTIONS,
    output_schema: OUTPUT_SCHEMA,
    evaluation: HUEVO0_EVIDENCE,
  };
}

export function payloadChecksum(payload = huevo0Payload()) {
  return createHash('sha256').update(canonicalStringify(payload)).digest('hex');
}

export function definitionChecksum({ manifest, instructions, output_schema }) {
  return createHash('sha256').update(canonicalStringify({ manifest, instructions, output_schema })).digest('hex');
}

export function portableInventory(payload) {
  return [
    { path: 'agent.json', media_type: 'application/json', bytes: Buffer.byteLength(canonicalStringify(payload.manifest)) },
    { path: 'instructions.md', media_type: 'text/markdown', bytes: Buffer.byteLength(payload.instructions) },
    { path: 'output.schema.json', media_type: 'application/schema+json', bytes: Buffer.byteLength(canonicalStringify(payload.output_schema)) },
    { path: 'evidence/summary.json', media_type: 'application/json', bytes: Buffer.byteLength(canonicalStringify(payload.evaluation)) },
  ];
}

const SECRET_PATTERNS = [
  /sk-(?:proj|svcacct)-[A-Za-z0-9_-]{16,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{8,}["']/i,
];

export function scanPortablePayload(payload) {
  const serialized = canonicalStringify(payload);
  return SECRET_PATTERNS.some((pattern) => pattern.test(serialized))
    ? { safe: false, finding: 'secret_pattern_detected' }
    : { safe: true, finding: null };
}
