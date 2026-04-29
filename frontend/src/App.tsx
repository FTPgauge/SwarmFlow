import { useState } from 'react'
import LiveFeed, { type FeedMode } from './components/LiveFeed'
import HiveVisualizer from './components/HiveVisualizer'
import ExecutionConsole from './components/ExecutionConsole'
import GasGrid from './components/GasGrid'
import SentimentDial from './components/SentimentDial'
import RecommendationPanel from './components/RecommendationPanel'
import BridgeRanking from './components/BridgeRanking'
import WatchPanel from './components/WatchPanel'
import { Hexagon, Power, Wallet } from 'lucide-react'

export default function App() {
  const [feedMode, setFeedMode] = useState<FeedMode>('swarm')
  const [chain, setChain] = useState('ethereum')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [watchSymbols, setWatchSymbols] = useState<string[]>([])

  return (
    <div className="min-h-screen hive-grid-bg">
      {/* Top bar */}
      <header className="border-b" style={{ borderColor: 'var(--hive-border)', background: 'rgba(7,8,10,0.85)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon size={28} style={{ color: 'var(--hive-amber)', filter: 'drop-shadow(0 0 6px rgba(245,179,42,0.5))' }} fill="rgba(245,179,42,0.15)" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] mono font-bold" style={{ color: 'var(--hive-amber)' }}>SF</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold tracking-wider" style={{ color: 'var(--hive-text)' }}>SwarmFlow</span>
                <span className="text-[9px] mono uppercase tracking-[0.3em] px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(245,179,42,0.14)', color: 'var(--hive-amber)', border: '1px solid var(--hive-border)' }}>v1.0</span>
              </div>
              <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: 'var(--hive-muted)' }}>
                Smart execution · gas optimization · transaction intelligence
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <StatusPill ok label="Hive online" />
            <StatusPill ok label="Routes synced" />
            <button className="px-3 py-1.5 mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 rounded-sm"
              style={{ background: 'rgba(78,224,212,0.1)', color: 'var(--hive-cyan)', border: '1px solid rgba(78,224,212,0.4)' }}>
              <Wallet size={12} /> Connect Queen Wallet
            </button>
          </div>
          <button className="md:hidden p-2 rounded-sm" style={{ background: 'var(--hive-panel-2)', border: '1px solid var(--hive-border)' }}>
            <Power size={14} style={{ color: 'var(--hive-amber)' }} />
          </button>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 py-4 space-y-4">
        {/* Live feed */}
        <LiveFeed mode={feedMode} setMode={setFeedMode} watchlist={watchSymbols} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <ExecutionConsole chain={chain} onChain={setChain} onResult={setRecommendation} />
          </div>
          <div className="lg:col-span-6">
            <HiveVisualizer selectedChain={chain} onSelectChain={setChain} />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <SentimentDial />
            <GasGrid selectedChain={chain} onSelect={setChain} />
          </div>
        </div>

        {/* Recommendation */}
        <RecommendationPanel rec={recommendation} />

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BridgeRanking />
          <WatchPanel onWatchChange={setWatchSymbols} />
        </div>

        <footer className="pt-4 pb-8 text-center text-[10px] mono" style={{ color: 'var(--hive-muted)' }}>
          SwarmFlow operates on live on-chain gas, market, and sentiment feeds. Recommendations are tactical — not financial advice.
        </footer>
      </main>
    </div>
  )
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--hive-text-soft)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ok ? 'var(--hive-good)' : 'var(--hive-danger)', boxShadow: ok ? '0 0 6px var(--hive-good)' : 'none' }} />
      {label}
    </div>
  )
}
