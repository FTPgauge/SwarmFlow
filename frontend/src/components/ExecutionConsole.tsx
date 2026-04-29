import { useState } from 'react'
import { api } from '../lib/api'
import { Crosshair, Cpu, RefreshCw, Send } from 'lucide-react'

const TX_TYPES = ['buy', 'sell', 'swap', 'bridge', 'mint', 'approve', 'lp', 'transfer']
const CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'solana']
const URGENCY = [
  { id: 'low', label: 'Low', desc: 'flexible' },
  { id: 'medium', label: 'Medium', desc: 'today' },
  { id: 'high', label: 'High', desc: 'soon' },
  { id: 'now', label: 'Now', desc: 'immediate' },
]
const MODES = [
  { id: 'cost', label: 'Cost Priority', desc: 'lowest fees' },
  { id: 'urgency', label: 'Urgency Priority', desc: 'fastest path' },
  { id: 'hybrid', label: 'Hybrid Priority', desc: 'balanced' },
]

export default function ExecutionConsole({
  chain,
  onChain,
  onResult,
}: {
  chain: string
  onChain: (c: string) => void
  onResult: (r: any) => void
}) {
  const [tx_type, setTx] = useState('swap')
  const [symbol, setSymbol] = useState('ETH')
  const [amount, setAmount] = useState('0.5')
  const [urgency, setUrgency] = useState('medium')
  const [mode, setMode] = useState('hybrid')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setErr(null)
    try {
      const r = await fetch(api('optimize'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tx_type, symbol: symbol.toUpperCase(), amount: parseFloat(amount) || 0, chain, urgency, mode }),
      }).then((r) => r.json())
      if (r.error) throw new Error(r.error)
      onResult(r)
    } catch (e: any) {
      setErr(e?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel flex flex-col">
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--hive-border)' }}>
        <Crosshair size={14} style={{ color: 'var(--hive-amber)' }} />
        <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--hive-text-soft)' }}>Smart Execution Console</span>
      </div>

      <div className="p-3 space-y-3 text-xs">
        {/* Tx Type */}
        <div>
          <Label>Transaction</Label>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {TX_TYPES.map((t) => (
              <button key={t} onClick={() => setTx(t)} className="py-1.5 mono text-[10px] uppercase tracking-wider rounded-sm transition"
                style={{
                  background: tx_type === t ? 'rgba(245,179,42,0.16)' : 'var(--hive-panel-2)',
                  color: tx_type === t ? 'var(--hive-amber)' : 'var(--hive-text-soft)',
                  border: `1px solid ${tx_type === t ? 'var(--hive-border-strong)' : 'var(--hive-border)'}`,
                }}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Token</Label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input-hive uppercase" />
          </div>
          <div>
            <Label>Amount</Label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="input-hive" />
          </div>
        </div>

        <div>
          <Label>Chain</Label>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {CHAINS.map((c) => (
              <button key={c} onClick={() => onChain(c)} className="py-1.5 mono text-[10px] uppercase tracking-wider rounded-sm transition"
                style={{
                  background: chain === c ? 'rgba(78,224,212,0.14)' : 'var(--hive-panel-2)',
                  color: chain === c ? 'var(--hive-cyan)' : 'var(--hive-text-soft)',
                  border: `1px solid ${chain === c ? 'rgba(78,224,212,0.4)' : 'var(--hive-border)'}`,
                }}>{c.slice(0, 8)}</button>
            ))}
          </div>
        </div>

        <div>
          <Label>Urgency</Label>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {URGENCY.map((u) => (
              <button key={u.id} onClick={() => setUrgency(u.id)} className="py-1.5 flex flex-col items-center rounded-sm transition"
                style={{
                  background: urgency === u.id ? 'rgba(245,179,42,0.16)' : 'var(--hive-panel-2)',
                  color: urgency === u.id ? 'var(--hive-amber)' : 'var(--hive-text-soft)',
                  border: `1px solid ${urgency === u.id ? 'var(--hive-border-strong)' : 'var(--hive-border)'}`,
                }}>
                <span className="text-[10px] uppercase tracking-wider mono">{u.label}</span>
                <span className="text-[9px]" style={{ color: 'var(--hive-muted)' }}>{u.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Execution Mode</Label>
          <div className="space-y-1 mt-1">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className="w-full px-2 py-1.5 flex items-center justify-between rounded-sm transition"
                style={{
                  background: mode === m.id ? 'rgba(245,179,42,0.12)' : 'var(--hive-panel-2)',
                  border: `1px solid ${mode === m.id ? 'var(--hive-border-strong)' : 'var(--hive-border)'}`,
                }}>
                <span className="mono text-[11px] uppercase tracking-wider" style={{ color: mode === m.id ? 'var(--hive-amber)' : 'var(--hive-text)' }}>{m.label}</span>
                <span className="text-[9px]" style={{ color: 'var(--hive-muted)' }}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-2.5 mono text-[11px] uppercase tracking-[0.2em] rounded-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          style={{
            background: 'linear-gradient(180deg, rgba(245,179,42,0.18), rgba(245,179,42,0.05))',
            color: 'var(--hive-amber)',
            border: '1px solid var(--hive-border-strong)',
          }}
        >
          {busy ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
          {busy ? 'Computing route…' : 'Compute Optimal Route'}
        </button>
        {err && <div className="text-[11px]" style={{ color: 'var(--hive-danger)' }}>Failed to compute. Try again.</div>}
        <div className="flex items-center gap-1.5 pt-1 text-[10px]" style={{ color: 'var(--hive-muted)' }}>
          <Cpu size={11} /> Brain: gas + sentiment + congestion model
        </div>
      </div>

      <style>{`
        .input-hive {
          width: 100%;
          background: var(--hive-panel-2);
          border: 1px solid var(--hive-border);
          color: var(--hive-text);
          padding: 6px 8px;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          border-radius: 3px;
          outline: none;
        }
        .input-hive:focus { border-color: var(--hive-border-strong); }
      `}</style>
    </div>
  )
}

function Label({ children }: { children: any }) {
  return <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--hive-muted)' }}>{children}</div>
}
