import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Combine } from 'lucide-react'

type Bridge = { project: string; volume_usd: number; tx_count: number }

function fmtUsd(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export default function BridgeRanking() {
  const [bridges, setBridges] = useState<Bridge[]>([])

  useEffect(() => {
    let cancel = false
    fetch(api('bridges?time_range=7d&limit=12')).then((r) => r.json()).then((r) => { if (!cancel) setBridges(r.data || []) })
    return () => { cancel = true }
  }, [])

  const max = Math.max(...bridges.map((b) => b.volume_usd), 1)

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex items-center gap-2">
          <Combine size={13} style={{ color: 'var(--hive-amber)' }} />
          <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Bridge Volume — 7D</span>
        </div>
        <span className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>route reliability</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--hive-border)' }}>
        {bridges.length === 0 && (
          <div className="px-3 py-6 text-center text-[11px]" style={{ color: 'var(--hive-muted)' }}>Loading bridge data…</div>
        )}
        {bridges.map((b, i) => (
          <div key={b.project} className="px-3 py-2 flex items-center gap-3">
            <span className="mono text-[10px] w-6" style={{ color: 'var(--hive-muted)' }}>#{i + 1}</span>
            <span className="mono text-[12px] uppercase tracking-wider w-24" style={{ color: 'var(--hive-text)' }}>{b.project}</span>
            <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full transition-all" style={{ width: `${(b.volume_usd / max) * 100}%`, background: 'linear-gradient(90deg, var(--hive-amber), var(--hive-cyan))', boxShadow: '0 0 6px rgba(245,179,42,0.4)' }} />
            </div>
            <span className="mono text-[11px] w-16 text-right" style={{ color: 'var(--hive-amber-soft)' }}>{fmtUsd(b.volume_usd)}</span>
            <span className="mono text-[9px] w-14 text-right" style={{ color: 'var(--hive-muted)' }}>{b.tx_count.toLocaleString()} tx</span>
          </div>
        ))}
      </div>
    </div>
  )
}
