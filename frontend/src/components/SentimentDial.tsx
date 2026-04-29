import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Gauge } from 'lucide-react'

export default function SentimentDial() {
  const [latest, setLatest] = useState<{ value: number; classification: string; price: number } | null>(null)

  useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        const r = await fetch(api('sentiment')).then((r) => r.json())
        if (!cancel) setLatest(r?.latest || null)
      } catch {}
    }
    load()
    const t = setInterval(load, 60000)
    return () => { cancel = true; clearInterval(t) }
  }, [])

  const v = latest?.value ?? 0
  const angle = -90 + (v / 100) * 180 // -90 to +90
  const tone =
    v < 25 ? '#ff4d6d' : v < 45 ? '#ff8a4c' : v < 55 ? '#f5b32a' : v < 75 ? '#9be46a' : '#5fdca0'

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--hive-border)' }}>
        <Gauge size={13} style={{ color: 'var(--hive-amber)' }} />
        <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Market Sentiment</span>
      </div>
      <div className="p-3 flex items-center gap-3">
        <svg viewBox="0 0 100 60" className="flex-shrink-0" style={{ width: 110 }}>
          <defs>
            <linearGradient id="dialGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="50%" stopColor="#f5b32a" />
              <stop offset="100%" stopColor="#5fdca0" />
            </linearGradient>
          </defs>
          <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="url(#dialGrad)" strokeWidth="6" strokeLinecap="round" />
          <line
            x1="50" y1="55"
            x2={50 + Math.cos((angle * Math.PI) / 180) * 30}
            y2={55 + Math.sin((angle * Math.PI) / 180) * 30}
            stroke={tone} strokeWidth="2.5" strokeLinecap="round"
          />
          <circle cx="50" cy="55" r="3" fill={tone} />
        </svg>
        <div className="flex-1">
          <div className="mono text-2xl font-bold" style={{ color: tone }}>{v}</div>
          <div className="text-[11px] uppercase tracking-wider mono" style={{ color: 'var(--hive-text-soft)' }}>
            {latest?.classification || '—'}
          </div>
          <div className="text-[10px] mono" style={{ color: 'var(--hive-muted)' }}>
            BTC: ${latest?.price ? latest.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
