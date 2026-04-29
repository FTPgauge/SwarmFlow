import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Fuel } from 'lucide-react'

type GasChain = {
  chain: string
  gas_price_gwei: number | null
  ok: boolean
  transfer_usd: number | null
  swap_usd: number | null
  bridge_usd: number | null
  synthetic?: boolean
}

const CHAIN_LABEL: Record<string, string> = {
  ethereum: 'Ethereum', polygon: 'Polygon', bsc: 'BNB Chain',
  arbitrum: 'Arbitrum', optimism: 'Optimism', base: 'Base', solana: 'Solana',
}

function severityFor(usd: number | null) {
  if (usd == null) return { label: 'unknown', color: '#6f7787', pct: 0 }
  if (usd < 0.05) return { label: 'minimal', color: '#5fdca0', pct: 8 }
  if (usd < 1) return { label: 'low', color: '#9be46a', pct: 22 }
  if (usd < 5) return { label: 'moderate', color: '#f5b32a', pct: 50 }
  if (usd < 20) return { label: 'high', color: '#ff8a4c', pct: 75 }
  return { label: 'severe', color: '#ff4d6d', pct: 100 }
}

function fmtUsd(n: number | null) {
  if (n == null) return '—'
  if (n < 0.01) return `$${n.toFixed(4)}`
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toFixed(2)}`
}

export default function GasGrid({ selectedChain, onSelect }: { selectedChain: string; onSelect: (c: string) => void }) {
  const [chains, setChains] = useState<GasChain[]>([])
  const [tab, setTab] = useState<'transfer' | 'swap' | 'bridge'>('swap')

  useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        const r = await fetch(api('gas')).then((r) => r.json())
        if (!cancel) setChains(r.chains || [])
      } catch {}
    }
    load()
    const t = setInterval(load, 12000)
    return () => { cancel = true; clearInterval(t) }
  }, [])

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex items-center gap-2">
          <Fuel size={13} style={{ color: 'var(--hive-amber)' }} />
          <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Gas Heatmap</span>
        </div>
        <div className="flex gap-1">
          {(['transfer', 'swap', 'bridge'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-2 py-0.5 text-[10px] mono uppercase rounded-sm"
              style={{
                background: tab === t ? 'rgba(245,179,42,0.14)' : 'transparent',
                color: tab === t ? 'var(--hive-amber)' : 'var(--hive-muted)',
                border: `1px solid ${tab === t ? 'var(--hive-border-strong)' : 'transparent'}`,
              }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--hive-border)' }}>
        {chains.map((c) => {
          const usd = c[`${tab}_usd` as keyof GasChain] as number | null
          const sev = severityFor(usd)
          const isSel = c.chain === selectedChain
          return (
            <button
              key={c.chain}
              onClick={() => onSelect(c.chain)}
              className="w-full px-3 py-2 flex items-center gap-3 text-left transition hover:bg-[rgba(245,179,42,0.04)]"
              style={{
                background: isSel ? 'rgba(78,224,212,0.06)' : 'transparent',
                borderLeft: `2px solid ${isSel ? 'var(--hive-cyan)' : 'transparent'}`,
              }}
            >
              <span className="mono text-[12px] uppercase font-bold tracking-wider w-20 flex-shrink-0" style={{ color: isSel ? 'var(--hive-cyan)' : 'var(--hive-text)' }}>
                {CHAIN_LABEL[c.chain] || c.chain}
              </span>
              <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full transition-all" style={{ width: `${sev.pct}%`, background: sev.color, boxShadow: `0 0 8px ${sev.color}` }} />
              </div>
              <span className="mono text-[11px] w-14 text-right" style={{ color: sev.color }}>{fmtUsd(usd)}</span>
              <span className="mono text-[9px] uppercase w-16 text-right" style={{ color: 'var(--hive-muted)' }}>
                {c.gas_price_gwei != null ? `${c.gas_price_gwei.toFixed(2)} gwei` : c.synthetic ? 'flat fee' : '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
