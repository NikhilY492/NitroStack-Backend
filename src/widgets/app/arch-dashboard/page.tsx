'use client';

import { useWidgetSDK } from '@nitrostack/widgets';
import { useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyCheck {
  ruleId: string;
  label: string;
  passed: boolean;
  severity?: 'error' | 'warning' | 'info';
  reason?: string;
}

interface PricingBreakdown {
  monthlyCost: number;
  compute: number;
  storage: number;
  networkEgress: number;
  cache: number;
  other: number;
}

interface ArchitectureCandidate {
  id: string;
  label: string;
  compute: string;
  database: string;
  cache: boolean;
  scaling: string;
  instanceType: string;
  monthlyCost?: number;
}

interface CandidateScore {
  candidateId: string;
  withinBudget: boolean;
  meetsSla: boolean;
  policyPassRate: number;
  relativeCostRank: number;
}

interface InfrastructureAnalysis {
  id: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  sessionId: string;
  requirements: {
    description: string;
    expectedUsers: number;
    monthlyBudget: number;
    slaTarget: string;
    environment: string;
    classification: string[];
  };
  recommended: {
    candidate: ArchitectureCandidate;
    pricing: PricingBreakdown;
    policyResults: PolicyCheck[];
    scores: CandidateScore;
  };
  alternatives: Array<{
    candidate: ArchitectureCandidate;
    rejectionReason: string;
    pricing?: PricingBreakdown;
    policyResults?: PolicyCheck[];
  }>;
  reasoning: {
    summary: string;
    bullets: string[];
    confidence: number;
  };
  terraform: { hcl: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

const COMPUTE_ICONS: Record<string, string> = {
  ecs_fargate: '📦',
  ec2: '🖥️',
  lambda: 'λ',
};

const DB_ICONS: Record<string, string> = {
  postgresql: '🐘',
  dynamodb: '⚡',
};

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#34d399', '#f87171'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending:  { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', label: '⏳ Awaiting Approval' },
    approved: { bg: 'rgba(52,211,153,0.15)', color: '#34d399', label: '✅ Approved' },
    rejected: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', label: '❌ Rejected' },
  }[status] ?? { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', label: status };

  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      border: `1px solid ${config.color}40`,
    }}>
      {config.label}
    </span>
  );
}

function PolicyBadge({ check }: { check: PolicyCheck }) {
  const color = check.passed
    ? '#34d399'
    : check.severity === 'warning'
    ? '#f59e0b'
    : '#f87171';
  const icon = check.passed ? '✓' : check.severity === 'warning' ? '⚠' : '✗';

  return (
    <span
      title={check.reason ?? check.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'help',
      }}
    >
      {icon} {check.label}
    </span>
  );
}

function CandidateCard({
  candidate,
  pricing,
  policyResults,
  isRecommended,
  rejectionReason,
}: {
  candidate: ArchitectureCandidate;
  pricing?: PricingBreakdown;
  policyResults?: PolicyCheck[];
  isRecommended: boolean;
  rejectionReason?: string;
}) {
  const cost = pricing?.monthlyCost ?? candidate.monthlyCost;

  return (
    <div style={{
      background: isRecommended
        ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.08) 100%)'
        : 'rgba(255,255,255,0.03)',
      border: isRecommended ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px',
      position: 'relative',
      transition: 'transform 0.2s',
    }}>
      {isRecommended && (
        <div style={{
          position: 'absolute',
          top: '-1px',
          right: '20px',
          background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 800,
          padding: '2px 10px',
          borderRadius: '0 0 8px 8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          ★ RECOMMENDED
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
            {COMPUTE_ICONS[candidate.compute] ?? '☁️'} {candidate.label}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {candidate.instanceType} · {candidate.scaling === 'auto' ? 'Auto Scale' : 'Fixed'} · {DB_ICONS[candidate.database] ?? ''} {candidate.database}{candidate.cache ? ' + Redis' : ''}
          </div>
        </div>
        {cost != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: isRecommended ? '#818cf8' : '#94a3b8' }}>
              {formatINR(cost)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>/month</div>
          </div>
        )}
      </div>

      {policyResults && policyResults.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {policyResults.map(p => (
            <PolicyBadge key={p.ruleId} check={p} />
          ))}
        </div>
      )}

      {!isRecommended && rejectionReason && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#94a3b8',
          lineHeight: 1.5,
        }}>
          <span style={{ color: '#f87171', fontWeight: 600 }}>Not recommended: </span>
          {rejectionReason}
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function ArchDashboard() {
  const { isReady, getToolOutput, callTool } = useWidgetSDK();
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTerraform, setShowTerraform] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reasoning' | 'terraform'>('overview');

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#94a3b8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⚙️</div>
          Loading analysis dashboard...
        </div>
      </div>
    );
  }

  const analysis = getToolOutput<InfrastructureAnalysis>();
  if (!analysis) {
    return (
      <div style={{ color: '#f87171', padding: '20px', fontFamily: 'monospace' }}>
        Error: No analysis payload received from present_analysis tool.
      </div>
    );
  }

  const { recommended, alternatives, requirements, reasoning, terraform, id } = analysis;
  const status = decision ?? analysis.status;

  const animatedCost = useCountUp(recommended.pricing.monthlyCost);

  const pieData = [
    { name: 'Compute', value: recommended.pricing.compute },
    { name: 'Database', value: recommended.pricing.storage || (recommended.pricing.monthlyCost - recommended.pricing.compute - recommended.pricing.networkEgress - recommended.pricing.cache - recommended.pricing.other) },
    { name: 'Network', value: recommended.pricing.networkEgress },
    { name: 'Cache', value: recommended.pricing.cache },
    { name: 'Other', value: recommended.pricing.other },
  ].filter(d => d.value > 0);

  const handleDecision = async (dec: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      await callTool('submit_approval', { analysisId: id, decision: dec });
      setDecision(dec);
    } catch (err) {
      console.error('Approval submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const budgetUsedPct = Math.round((recommended.pricing.monthlyCost / requirements.monthlyBudget) * 100);

  return (
    <div style={{
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #0d1117 100%)',
      color: '#e2e8f0',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      maxWidth: '900px',
      margin: '0 auto',
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            🏗 Shift-Left FinOps
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Infrastructure Analysis
          </h1>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {requirements.description} · {requirements.expectedUsers.toLocaleString()} users · Session {analysis.sessionId.slice(0, 8)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <StatusBadge status={status} />
          <div style={{ fontSize: '11px', color: '#475569' }}>
            Confidence: {Math.round(reasoning.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* ── Cost Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '28px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '24px',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
            RECOMMENDED MONTHLY COST
          </div>
          <div style={{
            fontSize: '52px',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {formatINR(animatedCost)}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255,255,255,0.08)',
              flex: 1,
              maxWidth: '200px',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                width: `${Math.min(budgetUsedPct, 100)}%`,
                background: budgetUsedPct > 90
                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                  : budgetUsedPct > 70
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #34d399, #22d3ee)',
                transition: 'width 1.2s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {budgetUsedPct}% of {formatINR(requirements.monthlyBudget)} budget
            </span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {requirements.classification.map(tag => (
              <span key={tag} style={{
                background: 'rgba(99,102,241,0.12)',
                color: '#818cf8',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div style={{ width: '160px', height: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatINR(v)}
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#94a3b8' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                {d.name}: {formatINR(d.value)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 28px' }}>
        {(['overview', 'reasoning', 'terraform'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab ? '#818cf8' : '#64748b',
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'capitalize',
              letterSpacing: '0.01em',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'overview' ? '🏗 Overview' : tab === 'reasoning' ? '🧠 Reasoning' : '📄 Terraform'}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CandidateCard
              candidate={recommended.candidate}
              pricing={recommended.pricing}
              policyResults={recommended.policyResults}
              isRecommended
            />
            {alternatives.map(alt => (
              <CandidateCard
                key={alt.candidate.id}
                candidate={alt.candidate}
                pricing={alt.pricing}
                policyResults={alt.policyResults}
                isRecommended={false}
                rejectionReason={alt.rejectionReason}
              />
            ))}
          </div>
        )}

        {/* ── Reasoning Tab ────────────────────────────────────────────────── */}
        {activeTab === 'reasoning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '20px',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🧠 Agent Reasoning Summary
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: 1.7 }}>
                {reasoning.summary}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Decision Factors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reasoning.bullets.map((bullet, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>SLA COMPLIANCE</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: recommended.scores.meetsSla ? '#34d399' : '#f87171' }}>
                  {recommended.scores.meetsSla ? '✓' : '✗'} SLA Target: {requirements.slaTarget}
                </div>
                <div style={{ fontSize: '13px', color: recommended.scores.withinBudget ? '#34d399' : '#f87171' }}>
                  {recommended.scores.withinBudget ? '✓' : '✗'} Within Budget
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Policy Pass Rate: {Math.round(recommended.scores.policyPassRate * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Terraform Tab ────────────────────────────────────────────────── */}
        {activeTab === 'terraform' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                HCL for <strong style={{ color: '#818cf8' }}>{recommended.candidate.label}</strong>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(terraform.hcl)}
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#818cf8',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📋 Copy
              </button>
            </div>
            <pre style={{
              background: '#0a0a14',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
              fontSize: '12px',
              lineHeight: 1.7,
              color: '#a5f3fc',
              overflowX: 'auto',
              maxHeight: '400px',
              overflowY: 'auto',
              margin: 0,
              fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
            }}>
              {terraform.hcl}
            </pre>
          </div>
        )}
      </div>

      {/* ── Approve / Reject ────────────────────────────────────────────────── */}
      {status === 'pending' && (
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Approve to write Terraform to <code style={{ color: '#94a3b8' }}>sample-project/main.tf</code>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              id="reject-btn"
              onClick={() => handleDecision('rejected')}
              disabled={loading}
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1,
              }}
            >
              ✗ Reject
            </button>
            <button
              id="approve-btn"
              onClick={() => handleDecision('approved')}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 28px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? '⏳ Processing...' : '✓ Approve & Write Terraform'}
            </button>
          </div>
        </div>
      )}

      {status === 'approved' && (
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid rgba(52,211,153,0.2)',
          background: 'rgba(52,211,153,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '24px' }}>✅</div>
          <div>
            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '14px' }}>Terraform Approved</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              HCL has been written to <code>sample-project/main.tf</code>
            </div>
          </div>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid rgba(248,113,113,0.2)',
          background: 'rgba(248,113,113,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '24px' }}>❌</div>
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '14px' }}>Rejected</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Re-run the agent with modified constraints to generate a new plan.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
