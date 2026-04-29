import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Activity, BarChart3, Hexagon, Sparkles } from 'lucide-react'

type Coin = {
  rank: number
  symbol: string
  name?: string
  image?: string
  price_usd: number
  change_24h_pct: number
  volume_24h_usd: number
  market_cap_usd: number
}

export type FeedMode = 'ticker' | 'board' | 'swarm' | 'custom'

const MODES: { id: FeedMode; label: string; icon: any }[] = [
  { id: 'ticker', label: 'Ticker', icon: Activity },
  { id: 'board', label: 'Flat Board', icon: BarChart3 },
  { id: 'swarm', label: 'Swarm', icon: Hexagon },
  { id: 'custom', label: 'Custom', icon: Sparkles },
]

function fmtPrice(n: number) {
  if (n == null) return '—'
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (n >= 1) return n.toFixed(2)
  if (n >= 0.01) return n.toFixed(4)
  return n.toPrecision(3)
}

export default function LiveFeed({
  mode,
  setMode,
  watchlist,
}: {
  mode: FeedMode
  setMode: (m: FeedMode) => void
  watchlist: string[]
}) {
  const [coins, setCoins] = useState<Coin[]>([])
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        const r = await fetch(api('market?limit=30')).then((r) => r.json())
        if (!cancel) {
          setCoins((r.data || []).filter((c: Coin) => c.symbol))
          setPulseKey((k) => k + 1)
        }
      } catch {}
    }
    load()
    const t = setInterval(load, 12000)
    return () => { cancel = true; clearInterval(t) }
  }, [])

  // Promote watchlist tokens to the front
  const ordered = (() => {
    if (!watchlist.length) return coins
    const watch = new Set(watchlist.map((s) => s.toUpperCase()))
    const front = coins.filter((c) => watch.has(c.symbol))
    const rest = coins.filter((c) => !watch.has(c.symbol))
    return [...front, ...rest]
  })()

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--hive-good)', boxShadow: '0 0 8px var(--hive-good)' }} />
          <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Live Market Feed</span>
          <span className="mono text-[11px]" style={{ color: 'var(--hive-muted)' }}>· {coins.length} signals</span>
        </div>
        <div className="flex gap-1">
          {MODES.map((m) => {
            const Active = m.id === mode
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="px-2 py-1 text-[11px] tracking-wide flex items-center gap-1 rounded-sm transition"
                style={{
                  background: Active ? 'rgba(245,179,42,0.14)' : 'transparent',
                  color: Active ? 'var(--hive-amber)' : 'var(--hive-text-soft)',
                  border: '1px solid',
                  borderColor: Active ? 'var(--hive-border-strong)' : 'transparent',
                }}
              >
                <Icon size={12} /> {m.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="relative">
        {mode === 'ticker' && <TickerMode coins={ordered} key={`t${pulseKey}`} />}
        {mode === 'board' && <BoardMode coins={ordered.slice(0, 16)} />}
        {mode === 'swarm' && <SwarmMode coins={ordered.slice(0, 22)} />}
        {mode === 'custom' && <CustomMode coins={ordered.slice(0, 18)} />}
      </div>
    </div>
  )
}

function TickerMode({ coins }: { coins: Coin[] }) {
  if (!coins.length) return <div className="h-14 flex items-center px-3 text-xs" style={{ color: 'var(--hive-muted)' }}>Awaiting market signals…</div>
  const doubled = [...coins, ...coins]
  return (
    <div className="overflow-hidden h-14 relative">
      <div className="absolute inset-y-0 left-0 w-12 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, var(--hive-panel), transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-12 z-10 pointer-events-none" style={{ background: 'linear-gradient(-90deg, var(--hive-panel), transparent)' }} />
      <div className="flex gap-6 h-full items-center whitespace-nowrap" style={{ animation: 'ticker-scroll 80s linear infinite', width: 'max-content' }}>
        {doubled.map((c, i) => (
          <div key={c.symbol + i} className="flex items-center gap-2 mono text-xs">
            <span className="font-bold tracking-wider" style={{ color: 'var(--hive-amber)' }}>{c.symbol}</span>
            <span style={{ color: 'var(--hive-text)' }}>${fmtPrice(c.price_usd)}</span>
            <span style={{ color: c.change_24h_pct >= 0 ? 'var(--hive-good)' : 'var(--hive-danger)' }}>
              {c.change_24h_pct >= 0 ? '▲' : '▼'} {Math.abs(c.change_24h_pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BoardMode({ coins }: { coins: Coin[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px" style={{ background: 'var(--hive-border)' }}>
      {coins.map((c) => {
        const up = c.change_24h_pct >= 0
        return (
          <div key={c.symbol} className="px-2.5 py-2 flex flex-col" style={{ background: 'var(--hive-panel)' }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] mono font-bold tracking-wider" style={{ color: 'var(--hive-amber)' }}>{c.symbol}</span>
              <span className="text-[9px]" style={{ color: 'var(--hive-muted)' }}>#{c.rank}</span>
            </div>
            <div className="text-[13px] mono mt-0.5">${fmtPrice(c.price_usd)}</div>
            <div className="text-[10px] mono" style={{ color: up ? 'var(--hive-good)' : 'var(--hive-danger)' }}>
              {up ? '+' : ''}{c.change_24h_pct.toFixed(2)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SwarmMode({ coins }: { coins: Coin[] }) {
  if (!coins.length) return <div className="h-56" />
  return (
    <div className="relative h-56 overflow-hidden">
      {coins.map((c, i) => {
        const up = c.change_24h_pct >= 0
        const intensity = Math.min(Math.abs(c.change_24h_pct) / 8, 1)
        const size = 36 + intensity * 28
        // Pseudo-random spread based on rank
        const x = ((i * 137) % 95) + 1
        const y = ((i * 71) % 80) + 5
        const dur = 6 + (i % 6)
        return (
          <div
            key={c.symbol}
            className="absolute flex items-center justify-center rounded-full mono font-bold"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              fontSize: Math.max(10, size / 4.5),
              background: up
                ? `radial-gradient(circle at 30% 30%, rgba(95,220,160,${0.4 + intensity * 0.4}), rgba(95,220,160,0.05))`
                : `radial-gradient(circle at 30% 30%, rgba(255,77,109,${0.35 + intensity * 0.4}), rgba(255,77,109,0.05))`,
              border: `1px solid ${up ? 'rgba(95,220,160,0.4)' : 'rgba(255,77,109,0.4)'}`,
              color: 'var(--hive-text)',
              animation: `drift ${dur}s ease-in-out infinite, pulse-hive ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              boxShadow: `0 0 ${10 + intensity * 30}px ${up ? 'rgba(95,220,160,0.3)' : 'rgba(255,77,109,0.3)'}`,
            }}
            title={`${c.name || c.symbol} · $${fmtPrice(c.price_usd)} · ${c.change_24h_pct.toFixed(2)}%`}
          >
            {c.symbol}
          </div>
        )
      })}
    </div>
  )
}

function CustomMode({ coins }: { coins: Coin[] }) {
  return (
    <div className="p-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {coins.map((c) => {
          const up = c.change_24h_pct >= 0
          return (
            <div
              key={c.symbol}
              className="px-3 py-2 panel-2 flex items-center gap-2"
              style={{ borderColor: up ? 'rgba(95,220,160,0.25)' : 'rgba(255,77,109,0.25)' }}
            >
              <div
                className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center mono text-[10px] font-bold"
                style={{
                  background: up ? 'rgba(95,220,160,0.15)' : 'rgba(255,77,109,0.15)',
                  color: up ? 'var(--hive-good)' : 'var(--hive-danger)',
                  animation: 'pulse-hive 2.5s ease-in-out infinite',
                }}
              >
                {c.symbol.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] mono font-bold tracking-wider" style={{ color: 'var(--hive-amber)' }}>{c.symbol}</span>
                  <span className="text-[9px]" style={{ color: 'var(--hive-muted)' }}>#{c.rank}</span>
                </div>
                <div className="text-[12px] mono">${fmtPrice(c.price_usd)}</div>
                <div className="text-[10px] mono" style={{ color: up ? 'var(--hive-good)' : 'var(--hive-danger)' }}>
                  {up ? '+' : ''}{c.change_24h_pct.toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
