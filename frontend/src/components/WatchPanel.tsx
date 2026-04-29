import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Bell, Eye, Plus, Trash2 } from 'lucide-react'

type Watch = { id: number; symbol: string; name?: string; chain?: string; notes?: string }
type Alert = { id: number; chain: string; threshold_gwei: number; enabled: boolean }

export default function WatchPanel({ onWatchChange }: { onWatchChange: (symbols: string[]) => void }) {
  const [tab, setTab] = useState<'watch' | 'alerts'>('watch')
  const [watches, setWatches] = useState<Watch[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [sym, setSym] = useState('')
  const [chain, setChain] = useState('ethereum')
  const [thresh, setThresh] = useState('5')

  const loadWatch = async () => {
    const r = await fetch(api('watchlist')).then((r) => r.json())
    setWatches(Array.isArray(r) ? r : [])
    onWatchChange((Array.isArray(r) ? r : []).map((w: Watch) => w.symbol))
  }
  const loadAlerts = async () => {
    const r = await fetch(api('alerts')).then((r) => r.json())
    setAlerts(Array.isArray(r) ? r : [])
  }

  useEffect(() => { loadWatch(); loadAlerts() }, [])

  const addWatch = async () => {
    if (!sym.trim()) return
    await fetch(api('watchlist'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ symbol: sym.toUpperCase(), chain }),
    })
    setSym('')
    loadWatch()
  }
  const delWatch = async (id: number) => {
    await fetch(api(`watchlist/${id}`), { method: 'DELETE' })
    loadWatch()
  }
  const addAlert = async () => {
    await fetch(api('alerts'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chain, threshold_gwei: parseFloat(thresh) || 5 }),
    })
    loadAlerts()
  }
  const delAlert = async (id: number) => {
    await fetch(api(`alerts/${id}`), { method: 'DELETE' })
    loadAlerts()
  }

  const CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'solana']

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--hive-border)' }}>
        <div className="flex gap-1">
          <button onClick={() => setTab('watch')} className="px-2 py-1 text-[11px] mono uppercase tracking-wider rounded-sm flex items-center gap-1"
            style={{ background: tab === 'watch' ? 'rgba(245,179,42,0.14)' : 'transparent', color: tab === 'watch' ? 'var(--hive-amber)' : 'var(--hive-text-soft)' }}>
            <Eye size={11} /> Watchlist
          </button>
          <button onClick={() => setTab('alerts')} className="px-2 py-1 text-[11px] mono uppercase tracking-wider rounded-sm flex items-center gap-1"
            style={{ background: tab === 'alerts' ? 'rgba(245,179,42,0.14)' : 'transparent', color: tab === 'alerts' ? 'var(--hive-amber)' : 'var(--hive-text-soft)' }}>
            <Bell size={11} /> Gas Alerts
          </button>
        </div>
        <span className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>
          {tab === 'watch' ? `${watches.length} tokens` : `${alerts.length} active`}
        </span>
      </div>

      {tab === 'watch' && (
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <input value={sym} onChange={(e) => setSym(e.target.value)} placeholder="SYMBOL e.g. PEPE"
              className="flex-1 mono uppercase text-xs px-2 py-1.5 rounded-sm outline-none"
              style={{ background: 'var(--hive-panel-2)', border: '1px solid var(--hive-border)', color: 'var(--hive-text)' }} />
            <select value={chain} onChange={(e) => setChain(e.target.value)}
              className="mono text-xs px-2 py-1.5 rounded-sm outline-none"
              style={{ background: 'var(--hive-panel-2)', border: '1px solid var(--hive-border)', color: 'var(--hive-text)' }}>
              {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addWatch} className="px-2 py-1.5 mono text-[10px] uppercase tracking-wider flex items-center gap-1 rounded-sm"
              style={{ background: 'rgba(245,179,42,0.14)', color: 'var(--hive-amber)', border: '1px solid var(--hive-border-strong)' }}>
              <Plus size={12} /> Track
            </button>
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
            {watches.length === 0 && <div className="text-[11px]" style={{ color: 'var(--hive-muted)' }}>No tokens tracked. Add one to personalize the live feed.</div>}
            {watches.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-2 py-1.5 panel-2 text-xs">
                <span className="mono font-bold" style={{ color: 'var(--hive-amber)' }}>{w.symbol}</span>
                <span className="mono text-[10px]" style={{ color: 'var(--hive-muted)' }}>{w.chain || 'any'}</span>
                <button onClick={() => delWatch(w.id)} className="opacity-50 hover:opacity-100"><Trash2 size={11} style={{ color: 'var(--hive-danger)' }} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <select value={chain} onChange={(e) => setChain(e.target.value)} className="flex-1 mono text-xs px-2 py-1.5 rounded-sm outline-none"
              style={{ background: 'var(--hive-panel-2)', border: '1px solid var(--hive-border)', color: 'var(--hive-text)' }}>
              {CHAINS.filter((c) => c !== 'solana').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={thresh} onChange={(e) => setThresh(e.target.value)} placeholder="gwei"
              className="w-24 mono text-xs px-2 py-1.5 rounded-sm outline-none"
              style={{ background: 'var(--hive-panel-2)', border: '1px solid var(--hive-border)', color: 'var(--hive-text)' }} />
            <button onClick={addAlert} className="px-2 py-1.5 mono text-[10px] uppercase tracking-wider flex items-center gap-1 rounded-sm"
              style={{ background: 'rgba(245,179,42,0.14)', color: 'var(--hive-amber)', border: '1px solid var(--hive-border-strong)' }}>
              <Plus size={12} /> Alert
            </button>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--hive-muted)' }}>
            Trigger when chain gas drops below threshold. Server polls every cycle.
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
            {alerts.length === 0 && <div className="text-[11px]" style={{ color: 'var(--hive-muted)' }}>No alerts armed.</div>}
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-2 py-1.5 panel-2 text-xs">
                <span className="mono uppercase" style={{ color: 'var(--hive-text)' }}>{a.chain}</span>
                <span className="mono" style={{ color: 'var(--hive-amber)' }}>≤ {a.threshold_gwei} gwei</span>
                <button onClick={() => delAlert(a.id)} className="opacity-50 hover:opacity-100"><Trash2 size={11} style={{ color: 'var(--hive-danger)' }} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
