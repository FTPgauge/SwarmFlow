import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

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
const CHAIN_GLYPH: Record<string, string> = {
  ethereum: 'Ξ', polygon: '◆', bsc: '◉', arbitrum: '◬', optimism: '○', base: '◎', solana: '◇',
}

function severityFor(usd: number | null) {
  if (usd == null) return { label: 'unknown', color: '#6f7787' }
  if (usd < 0.05) return { label: 'minimal', color: '#5fdca0' }
  if (usd < 1) return { label: 'low', color: '#9be46a' }
  if (usd < 5) return { label: 'moderate', color: '#f5b32a' }
  if (usd < 20) return { label: 'high', color: '#ff8a4c' }
  return { label: 'severe', color: '#ff4d6d' }
}

export default function HiveVisualizer({
  selectedChain,
  onSelectChain,
  whaleChains = ['ethereum', 'arbitrum'],
}: {
  selectedChain: string
  onSelectChain: (c: string) => void
  whaleChains?: string[]
}) {
  const [chains, setChains] = useState<GasChain[]>([])

  useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        const r = await fetch(api('gas')).then((r) => r.json())
        if (!cancel) setChains(r.chains || [])
      } catch {}
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancel = true; clearInterval(t) }
  }, [])

  // Position 7 hexagon nodes around a center
  const radius = 145
  const center = { x: 280, y: 200 }
  const positions = useMemo(() => {
    return chains.map((c, i) => {
      const angle = (i / Math.max(chains.length, 1)) * Math.PI * 2 - Math.PI / 2
      return {
        chain: c.chain,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      }
    })
  }, [chains])

  return (
    <div className="panel relative overflow-hidden h-full" style={{ minHeight: 420 }}>
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Hive Topology</span>
          <span className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>· wallet → chains → routes</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] mono" style={{ color: 'var(--hive-muted)' }}>
          <span><span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: 'var(--hive-amber)' }} /> Queen</span>
          <span><span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: 'var(--hive-cyan)' }} /> Worker</span>
          <span><span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: 'var(--hive-danger)' }} /> Predator</span>
        </div>
      </div>
      <div className="relative hive-grid-bg" style={{ height: 380 }}>
        <svg viewBox="0 0 560 400" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="queenGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245,179,42,0.6)" />
              <stop offset="100%" stopColor="rgba(245,179,42,0)" />
            </radialGradient>
            <filter id="softblur"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          {/* Radar sweep */}
          <g style={{ transformOrigin: `${center.x}px ${center.y}px`, animation: 'radar-sweep 14s linear infinite' }}>
            <path
              d={`M ${center.x} ${center.y} L ${center.x + radius + 40} ${center.y} A ${radius + 40} ${radius + 40} 0 0 1 ${center.x + (radius + 40) * Math.cos(Math.PI / 6)} ${center.y + (radius + 40) * Math.sin(Math.PI / 6)} Z`}
              fill="rgba(245,179,42,0.06)"
            />
          </g>

          {/* Routes */}
          {positions.map((p) => {
            const c = chains.find((x) => x.chain === p.chain)
            const sev = severityFor(c?.swap_usd ?? null)
            const isSel = selectedChain === p.chain
            return (
              <g key={`route-${p.chain}`}>
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={isSel ? 'var(--hive-cyan)' : sev.color}
                  strokeOpacity={isSel ? 0.95 : 0.45}
                  strokeWidth={isSel ? 2.4 : 1.4}
                  strokeDasharray="4 6"
                  style={isSel ? { animation: 'route-flow 1.2s linear infinite' } : undefined}
                />
              </g>
            )
          })}

          {/* Queen Node */}
          <circle cx={center.x} cy={center.y} r="48" fill="url(#queenGlow)" />
          <circle cx={center.x} cy={center.y} r="28" fill="rgba(245,179,42,0.18)" stroke="var(--hive-amber)" strokeWidth="1.5" />
          <text x={center.x} y={center.y - 2} textAnchor="middle" fill="var(--hive-amber)" fontSize="11" fontFamily="monospace" fontWeight="bold">QUEEN</text>
          <text x={center.x} y={center.y + 12} textAnchor="middle" fill="var(--hive-text-soft)" fontSize="9" fontFamily="monospace">wallet</text>

          {/* Chain Hex Nodes */}
          {positions.map((p) => {
            const c = chains.find((x) => x.chain === p.chain)
            const sev = severityFor(c?.swap_usd ?? null)
            const isSel = selectedChain === p.chain
            const isWhale = whaleChains.includes(p.chain)
            const hex = (cx: number, cy: number, r: number) => {
              const pts = []
              for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 - Math.PI / 2
                pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`)
              }
              return pts.join(' ')
            }
            return (
              <g key={p.chain} style={{ cursor: 'pointer' }} onClick={() => onSelectChain(p.chain)}>
                <polygon
                  points={hex(p.x, p.y, 30)}
                  fill={isSel ? 'rgba(78,224,212,0.18)' : 'rgba(15,17,21,0.9)'}
                  stroke={isSel ? 'var(--hive-cyan)' : sev.color}
                  strokeWidth={isSel ? 2 : 1.2}
                />
                <text x={p.x} y={p.y - 2} textAnchor="middle" fill="var(--hive-text)" fontSize="14" fontFamily="monospace" fontWeight="bold">
                  {CHAIN_GLYPH[p.chain]}
                </text>
                <text x={p.x} y={p.y + 11} textAnchor="middle" fill="var(--hive-text-soft)" fontSize="8" fontFamily="monospace">
                  {CHAIN_LABEL[p.chain] || p.chain}
                </text>
                {/* gas readout below hex */}
                <text x={p.x} y={p.y + 50} textAnchor="middle" fill={sev.color} fontSize="9" fontFamily="monospace">
                  {c?.gas_price_gwei != null ? `${c.gas_price_gwei.toFixed(2)} gwei` : c?.synthetic ? 'flat' : '—'}
                </text>
                <text x={p.x} y={p.y + 62} textAnchor="middle" fill="var(--hive-muted)" fontSize="8" fontFamily="monospace">
                  swap ≈ {c?.swap_usd != null ? (c.swap_usd < 0.01 ? `$${c.swap_usd.toFixed(4)}` : `$${c.swap_usd.toFixed(2)}`) : '—'}
                </text>
                {/* whale indicator */}
                {isWhale && (
                  <circle cx={p.x + 22} cy={p.y - 22} r="5" fill="var(--hive-danger)" style={{ animation: 'pulse-hive 1.6s ease-in-out infinite', transformOrigin: `${p.x + 22}px ${p.y - 22}px` }} />
                )}
              </g>
            )
          })}

          {/* Worker dots drifting around queen */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            const r = 70 + (i % 2) * 12
            return (
              <circle
                key={i}
                cx={center.x + Math.cos(a) * r}
                cy={center.y + Math.sin(a) * r}
                r="2.4"
                fill="var(--hive-cyan)"
                opacity="0.7"
                style={{ animation: `pulse-hive ${2 + (i % 3)}s ease-in-out infinite`, transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
