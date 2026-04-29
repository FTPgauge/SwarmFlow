import { AlertTriangle, ArrowDown, ArrowUp, ChevronRight, Hourglass, Route, Shield, Target } from 'lucide-react'

type Recommendation = {
  action: string
  timing: string
  predicted_window: string
  requested_chain: { chain: string; usd: number | null; severity: string; gwei: number | null }
  cheapest_chain: { chain: string; usd: number | null; severity: string; gwei: number | null }
  chain_costs: any[]
  wait_savings_pct: number
  wait_savings_usd: number | null
  slippage_risk: string
  quality_score: number
  sentiment: { value: number; classification: string } | null
  warnings: string[]
  dex_comparison: { dex: string; fee_bps: number; est_usd: number }[]
  summary: string
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  if (n < 0.01) return `$${n.toFixed(4)}`
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toFixed(2)}`
}

const ACTION_LABEL: Record<string, { label: string; tone: string; icon: any }> = {
  execute_now: { label: 'EXECUTE NOW', tone: 'var(--hive-good)', icon: Target },
  wait: { label: 'WAIT', tone: 'var(--hive-amber)', icon: Hourglass },
  wait_short: { label: 'HOLD BRIEFLY', tone: 'var(--hive-amber-soft)', icon: Hourglass },
  reroute_chain: { label: 'RE-ROUTE CHAIN', tone: 'var(--hive-cyan)', icon: Route },
}

export default function RecommendationPanel({ rec }: { rec: Recommendation | null }) {
  if (!rec) {
    return (
      <div className="panel p-6 flex flex-col items-center justify-center gap-2 text-center" style={{ minHeight: 280 }}>
        <Target size={28} style={{ color: 'var(--hive-amber)', opacity: 0.5 }} />
        <div className="text-sm" style={{ color: 'var(--hive-text-soft)' }}>Awaiting execution input</div>
        <div className="text-xs max-w-md" style={{ color: 'var(--hive-muted)' }}>
          Configure the transaction in the console — SwarmFlow will compute live gas, cheapest route, slippage risk, and timing across chains.
        </div>
      </div>
    )
  }

  const meta = ACTION_LABEL[rec.action] || ACTION_LABEL.execute_now
  const ActionIcon = meta.icon
  const score = rec.quality_score
  const scoreTone = score >= 80 ? 'var(--hive-good)' : score >= 60 ? 'var(--hive-amber)' : score >= 40 ? '#ff8a4c' : 'var(--hive-danger)'

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--hive-cyan)', animation: 'pulse-hive 1.5s ease-in-out infinite' }} />
          <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>AI Recommendation</span>
        </div>
        <div className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>quality {score}/100</div>
      </div>

      <div className="p-3 space-y-3">
        {/* Headline action */}
        <div className="flex items-stretch gap-2">
          <div className="px-3 py-3 flex flex-col items-center justify-center mono"
               style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${meta.tone}`, color: meta.tone, minWidth: 130 }}>
            <ActionIcon size={20} />
            <div className="text-[11px] tracking-[0.2em] mt-1 font-bold">{meta.label}</div>
          </div>
          <div className="flex-1 panel-2 p-3">
            <div className="text-[13px]" style={{ color: 'var(--hive-text)' }}>{rec.timing}</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--hive-text-soft)' }}>{rec.summary}</div>
          </div>
          <div className="px-3 py-3 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${scoreTone}`, minWidth: 90 }}>
            <div className="mono text-2xl font-bold" style={{ color: scoreTone }}>{score}</div>
            <div className="text-[9px] tracking-[0.2em] uppercase mono" style={{ color: 'var(--hive-muted)' }}>Score</div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Current cost" value={fmt(rec.requested_chain?.usd)} tone="var(--hive-text)" sub={rec.requested_chain?.chain?.toUpperCase()} />
          <Stat label="Cheapest route" value={fmt(rec.cheapest_chain?.usd)} tone="var(--hive-cyan)" sub={rec.cheapest_chain?.chain?.toUpperCase()} icon={Route} />
          <Stat label="Wait saves" value={`~${rec.wait_savings_pct}%`} tone="var(--hive-amber)" sub={rec.wait_savings_usd != null ? fmt(rec.wait_savings_usd) : '—'} icon={Hourglass} />
          <Stat label="Slippage risk" value={rec.slippage_risk.toUpperCase()} tone={rec.slippage_risk === 'high' ? 'var(--hive-danger)' : rec.slippage_risk === 'medium' ? 'var(--hive-amber)' : 'var(--hive-good)'} sub="execution" icon={Shield} />
        </div>

        {/* Predicted window */}
        <div className="panel-2 p-2.5 flex items-center gap-2 text-[12px]">
          <Hourglass size={13} style={{ color: 'var(--hive-amber)' }} />
          <span style={{ color: 'var(--hive-text-soft)' }}>Predicted lower-gas window:</span>
          <span className="mono" style={{ color: 'var(--hive-amber-soft)' }}>{rec.predicted_window}</span>
        </div>

        {/* Warnings */}
        {rec.warnings?.length > 0 && (
          <div className="space-y-1">
            {rec.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 panel-2 p-2 text-[12px]" style={{ borderColor: 'rgba(255,77,109,0.4)' }}>
                <AlertTriangle size={13} style={{ color: 'var(--hive-danger)', marginTop: 2 }} />
                <span style={{ color: 'var(--hive-text-soft)' }}>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* DEX Comparison */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--hive-muted)' }}>DEX Route Comparison</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'var(--hive-border)' }}>
            {rec.dex_comparison.map((d) => {
              const cheapest = Math.min(...rec.dex_comparison.map((x) => x.est_usd))
              const isBest = d.est_usd === cheapest
              return (
                <div key={d.dex} className="px-2.5 py-2" style={{ background: 'var(--hive-panel)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] mono" style={{ color: isBest ? 'var(--hive-good)' : 'var(--hive-text)' }}>{d.dex}</span>
                    {isBest && <ChevronRight size={11} style={{ color: 'var(--hive-good)' }} />}
                  </div>
                  <div className="text-[12px] mono mt-0.5" style={{ color: isBest ? 'var(--hive-good)' : 'var(--hive-text-soft)' }}>{fmt(d.est_usd)}</div>
                  <div className="text-[9px] mono" style={{ color: 'var(--hive-muted)' }}>fee {d.fee_bps}bps</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alternative chain comparison */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--hive-muted)' }}>Alternative Chain Costs</div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-px" style={{ background: 'var(--hive-border)' }}>
            {rec.chain_costs.map((c) => {
              const isReq = c.chain === rec.requested_chain?.chain
              const isCheap = c.chain === rec.cheapest_chain?.chain
              return (
                <div key={c.chain} className="px-2 py-1.5" style={{ background: 'var(--hive-panel)' }}>
                  <div className="text-[10px] mono uppercase" style={{ color: isReq ? 'var(--hive-cyan)' : isCheap ? 'var(--hive-good)' : 'var(--hive-text-soft)' }}>
                    {c.chain.slice(0, 8)}
                  </div>
                  <div className="text-[11px] mono" style={{ color: 'var(--hive-text)' }}>{fmt(c.usd)}</div>
                  <div className="flex items-center gap-1 text-[9px] mono" style={{ color: 'var(--hive-muted)' }}>
                    {isReq ? <ArrowUp size={8} /> : isCheap ? <ArrowDown size={8} /> : null}
                    {c.severity}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone, icon: Icon }: any) {
  return (
    <div className="panel-2 p-2.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--hive-muted)' }}>
        {Icon && <Icon size={10} />}{label}
      </div>
      <div className="mono text-[16px] font-bold mt-0.5" style={{ color: tone }}>{value}</div>
      <div className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>{sub}</div>
    </div>
  )
}
