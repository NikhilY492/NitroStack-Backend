/**
 * analysisFormatter.ts
 *
 * Converts a completed InfrastructureAnalysis payload into clean, readable
 * Markdown text. This is used in OpenAI mode so the coordinator can output
 * a human-friendly summary instead of raw JSON-Patch SDUI instructions.
 */

import { InfrastructureAnalysis } from '../types/state';
import { pendingAnalyses } from '../store/pendingAnalyses';
import { v4 as uuidv4 } from 'uuid';

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function formatAnalysis(
  input: Omit<InfrastructureAnalysis, 'id' | 'timestamp' | 'status'>
): { analysisId: string; markdown: string } {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  // Persist to store so submit_approval / write_approved_changes still work
  const analysis: InfrastructureAnalysis = {
    ...input,
    id,
    timestamp,
    status: 'pending',
  };
  pendingAnalyses.set(id, analysis);

  const { requirements, recommended, alternatives, reasoning, terraform } = input;

  // ── Header ──────────────────────────────────────────────────────────────────
  const lines: string[] = [
    '# 🏗️ Cloud Architecture Analysis',
    '',
    `> **${requirements.description}**`,
    '',
    '---',
    '',
    '## 📋 Requirements',
    '',
    `| Parameter | Value |`,
    `|-----------|-------|`,
    `| Environment | ${requirements.environment.toUpperCase()} |`,
    `| Expected Users | ${requirements.expectedUsers.toLocaleString()} |`,
    `| SLA Target | ${requirements.slaTarget} |`,
    `| Monthly Budget | ${INR(requirements.monthlyBudget)} |`,
    `| Classification | ${requirements.classification.join(', ')} |`,
    '',
    '---',
    '',
    '## 🏆 Recommended Architecture',
    '',
  ];

  const rec = recommended;
  const recLabel = rec.candidate.label;
  const recCost = INR(rec.pricing.monthlyCost);

  lines.push(
    `### ✅ ${recLabel}`,
    '',
    `| Property | Value |`,
    `|----------|-------|`,
    `| Compute | \`${rec.candidate.compute}\` |`,
    `| Database | \`${rec.candidate.database}\` |`,
    `| Instance Type | \`${rec.candidate.instanceType}\` |`,
    `| Cache | ${rec.candidate.cache ? 'Yes (Redis)' : 'No'} |`,
    `| Scaling | ${rec.candidate.scaling} |`,
    `| **Monthly Cost** | **${recCost}** |`,
    `| Within Budget | ${rec.scores.withinBudget ? '✅ Yes' : '❌ No'} |`,
    `| Meets SLA | ${rec.scores.meetsSla ? '✅ Yes' : '❌ No'} |`,
    `| Policy Pass Rate | ${Math.round(rec.scores.policyPassRate * 100)}% |`,
    '',
  );

  // ── Cost Breakdown ───────────────────────────────────────────────────────────
  lines.push(
    '### 💰 Cost Breakdown',
    '',
    `| Component | Monthly Cost |`,
    `|-----------|-------------|`,
    `| Compute | ${INR(rec.pricing.compute)} |`,
    `| Database / Storage | ${INR(rec.pricing.other)} |`,
    `| Cache | ${INR(rec.pricing.cache)} |`,
    `| Network Egress | ${INR(rec.pricing.networkEgress)} |`,
    `| **Total** | **${recCost}** |`,
    '',
  );

  // ── Policy Results ───────────────────────────────────────────────────────────
  if (rec.policyResults.length > 0) {
    lines.push('### 🛡️ Policy Compliance', '');
    for (const p of rec.policyResults) {
      const icon = p.passed ? '✅' : (p.severity === 'error' ? '❌' : '⚠️');
      const reason = p.reason ? ` — ${p.reason}` : '';
      lines.push(`- ${icon} **${p.label}**${reason}`);
    }
    lines.push('');
  }

  // ── Alternatives ─────────────────────────────────────────────────────────────
  if (alternatives.length > 0) {
    lines.push('---', '', '## 🔄 Alternatives Considered', '');
    for (const alt of alternatives) {
      const cost = alt.pricing ? ` (${INR(alt.pricing.monthlyCost)}/mo)` : '';
      lines.push(
        `### ${alt.candidate.label}${cost}`,
        '',
        `**Compute:** \`${alt.candidate.compute}\` | **Database:** \`${alt.candidate.database}\``,
        '',
        `> **Rejected:** ${alt.rejectionReason}`,
        '',
      );
    }
  }

  // ── Reasoning ────────────────────────────────────────────────────────────────
  lines.push(
    '---',
    '',
    '## 🧠 Coordinator Reasoning',
    '',
    `**Confidence:** ${Math.round(reasoning.confidence * 100)}%`,
    '',
    reasoning.summary,
    '',
  );
  for (const bullet of reasoning.bullets) {
    lines.push(`- ${bullet}`);
  }

  // ── Terraform ────────────────────────────────────────────────────────────────
  lines.push(
    '',
    '---',
    '',
    '## 🔧 Terraform Blueprint',
    '',
    '```hcl',
    terraform.hcl,
    '```',
    '',
    '---',
    '',
    `> **Analysis ID:** \`${id}\``,
    `> **Status:** 🕐 Pending Approval`,
    `> To approve, reply with \`approve ${id}\` or call the \`submit_approval\` tool.`,
    '',
  );

  return { analysisId: id, markdown: lines.join('\n') };
}
