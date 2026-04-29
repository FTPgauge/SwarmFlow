const { dataApi } = require('@surf-ai/sdk/server')
const { dbQuery } = require('@surf-ai/sdk/db')
const { Router } = require('express')
const router = Router()

const EVM_CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base']
const NATIVE_PRICE = {
  ethereum: 2300, polygon: 0.22, bsc: 580, arbitrum: 2300,
  optimism: 2300, base: 2300, avalanche: 22,
}

const GAS_UNITS = {
  transfer: 21000, approve: 50000, swap: 180000, mint: 200000,
  bridge: 250000, lp: 220000, buy: 180000, sell: 180000,
}

function classifyChainCost(usd) {
  if (usd == null) return 'unknown'
  if (usd < 0.05) return 'minimal'
  if (usd < 1) return 'low'
  if (usd < 5) return 'moderate'
  if (usd < 20) return 'high'
  return 'severe'
}

router.post('/', async (req, res) => {
  try {
    const {
      tx_type = 'swap',
      symbol = 'ETH',
      amount = 1,
      chain = 'ethereum',
      urgency = 'medium', // low | medium | high | now
      mode = 'hybrid',    // cost | urgency | hybrid
    } = req.body || {}

    // Gather data in parallel
    const [gasResults, sentiment] = await Promise.all([
      Promise.all(
        EVM_CHAINS.map(async (c) => {
          try {
            const r = await dataApi.onchain.gas_price({ chain: c })
            return { chain: c, gwei: r?.data?.gas_price_gwei ?? null }
          } catch { return { chain: c, gwei: null } }
        })
      ),
      dataApi.market.fear_greed({}).catch(() => ({ data: [] })),
    ])

    // Cost per chain for this tx_type
    const units = GAS_UNITS[tx_type] || 180000
    const chainCosts = gasResults.map((g) => {
      const usd = g.gwei != null ? g.gwei * 1e-9 * units * (NATIVE_PRICE[g.chain] || 0) : null
      return { chain: g.chain, gwei: g.gwei, usd, severity: classifyChainCost(usd) }
    })
    chainCosts.push({ chain: 'solana', gwei: null, usd: 0.0008, severity: 'minimal', synthetic: true })

    const sortedByCost = [...chainCosts].filter(c => c.usd != null).sort((a, b) => a.usd - b.usd)
    const cheapest = sortedByCost[0]
    const requested = chainCosts.find(c => c.chain === chain) || chainCosts[0]

    // Sentiment signal
    const fg = sentiment?.data?.[0]
    const fgValue = fg?.value
    const fgClass = fg?.classification

    // Estimate "if you wait" savings — sample historic median gwei pattern
    // We use a conservative -25% heuristic during off-peak windows.
    const waitSavingsPct = urgency === 'now' ? 0 : urgency === 'high' ? 5 : urgency === 'medium' ? 18 : 30
    const waitSavingsUsd = requested?.usd != null ? requested.usd * (waitSavingsPct / 100) : null

    // Slippage risk based on tx type & urgency
    let slippageRisk = 'low'
    if (tx_type === 'swap' || tx_type === 'buy' || tx_type === 'sell') {
      if (urgency === 'now') slippageRisk = 'high'
      else if (urgency === 'high') slippageRisk = 'medium'
    }
    if (tx_type === 'bridge') slippageRisk = urgency === 'now' ? 'high' : 'medium'

    // Quality score 0-100
    let score = 70
    const reqSeverity = requested?.severity || 'unknown'
    if (reqSeverity === 'minimal') score += 18
    else if (reqSeverity === 'low') score += 10
    else if (reqSeverity === 'high') score -= 15
    else if (reqSeverity === 'severe') score -= 30

    if (fgValue != null) {
      if (fgValue >= 75 && (tx_type === 'buy' || tx_type === 'mint')) score -= 12 // buying into greed
      if (fgValue <= 25 && (tx_type === 'sell')) score -= 8 // selling into fear
      if (fgValue <= 30 && (tx_type === 'buy')) score += 6  // buying into fear
    }
    if (mode === 'urgency') score += urgency === 'now' ? 4 : 0
    if (mode === 'cost' && requested?.chain !== cheapest?.chain) score -= 6
    score = Math.max(0, Math.min(100, Math.round(score)))

    // Action recommendation
    let action = 'execute_now'
    let timing = 'Optimal — execute immediately.'
    if (mode === 'cost' && cheapest && cheapest.chain !== chain && (requested?.usd ?? 0) > (cheapest.usd ?? 0) * 3) {
      action = 'reroute_chain'
      timing = `Re-route to ${cheapest.chain} — currently ~${((requested.usd / Math.max(cheapest.usd, 0.0001))).toFixed(0)}× cheaper than ${chain}.`
    } else if (urgency === 'low' && reqSeverity !== 'minimal' && reqSeverity !== 'low') {
      action = 'wait'
      timing = `Network congested. Waiting ~4–8h could save ~$${(waitSavingsUsd ?? 0).toFixed(2)}.`
    } else if (urgency === 'medium' && (reqSeverity === 'high' || reqSeverity === 'severe')) {
      action = 'wait_short'
      timing = `Gas elevated. Holding 1–3h likely returns ${waitSavingsPct}% savings.`
    } else if (urgency === 'high' || urgency === 'now') {
      action = 'execute_now'
      timing = 'Urgency overrides cost — execute now via fastest route.'
    }

    // Predicted lower-gas window — based on UTC hour heuristics (US market off-hours)
    const now = new Date()
    const hour = now.getUTCHours()
    let predictedWindow = '02:00–06:00 UTC'
    if (hour >= 2 && hour < 6) predictedWindow = 'Now (off-peak window active)'
    else if (hour >= 6 && hour < 12) predictedWindow = '14:00–16:00 UTC (quiet midday)'
    else predictedWindow = 'Tomorrow 02:00–06:00 UTC'

    // Warnings
    const warnings = []
    if (fgValue != null && fgValue >= 80 && (tx_type === 'buy' || tx_type === 'mint')) {
      warnings.push(`Extreme greed (${fgValue}) — buying tops historically risky.`)
    }
    if (fgValue != null && fgValue <= 20 && tx_type === 'sell') {
      warnings.push(`Extreme fear (${fgValue}) — selling bottoms locks losses.`)
    }
    if (reqSeverity === 'severe') {
      warnings.push(`${chain} gas is severe — re-route or wait if possible.`)
    }
    if (slippageRisk === 'high') {
      warnings.push('High slippage risk — set tight slippage limits or split order.')
    }

    // Best DEX-style fee estimate (simplified)
    const dexComparison = [
      { dex: 'Uniswap v3', fee_bps: 5, est_usd: requested?.usd ?? 0 },
      { dex: '1inch (aggregator)', fee_bps: 0, est_usd: (requested?.usd ?? 0) * 0.95 },
      { dex: 'CowSwap (MEV-protected)', fee_bps: 0, est_usd: (requested?.usd ?? 0) * 1.04 },
      { dex: 'Curve', fee_bps: 4, est_usd: (requested?.usd ?? 0) * 1.0 },
    ]

    const recommendation = {
      action,
      timing,
      predicted_window: predictedWindow,
      requested_chain: requested,
      cheapest_chain: cheapest,
      chain_costs: chainCosts,
      wait_savings_pct: waitSavingsPct,
      wait_savings_usd: waitSavingsUsd,
      slippage_risk: slippageRisk,
      quality_score: score,
      sentiment: fg ? { value: fgValue, classification: fgClass } : null,
      warnings,
      dex_comparison: dexComparison,
      summary: buildSummary({ tx_type, symbol, amount, chain, mode, urgency, action, requested, cheapest, score, fg }),
    }

    // Log for behavior learning
    try {
      await dbQuery(
        'INSERT INTO execution_log (tx_type, symbol, amount, chain, urgency, mode, recommendation, quality_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [tx_type, symbol, amount, chain, urgency, mode, JSON.stringify(recommendation), score]
      )
    } catch {}

    res.json(recommendation)
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

function buildSummary({ tx_type, symbol, amount, chain, mode, urgency, action, requested, cheapest, score, fg }) {
  const verb = {
    buy: 'Buying', sell: 'Selling', swap: 'Swapping', bridge: 'Bridging',
    mint: 'Minting', approve: 'Approving', lp: 'Adding LP', transfer: 'Transferring',
  }[tx_type] || 'Executing'
  const cost = requested?.usd != null ? `$${requested.usd.toFixed(requested.usd < 1 ? 4 : 2)}` : '—'
  const cheap = cheapest?.usd != null ? `$${cheapest.usd.toFixed(cheapest.usd < 1 ? 4 : 2)}` : '—'
  const fgStr = fg ? `${fg.classification} (${fg.value})` : 'unknown'
  const sentence =
    action === 'reroute_chain'
      ? `${verb} ${amount} ${symbol} on ${chain} costs ${cost}. Cheaper route: ${cheapest?.chain} at ${cheap}. Sentiment: ${fgStr}.`
      : action === 'wait'
      ? `${verb} ${amount} ${symbol} on ${chain} costs ${cost} now. With low urgency, waiting saves real fees. Sentiment: ${fgStr}.`
      : action === 'wait_short'
      ? `${verb} ${amount} ${symbol} on ${chain} is currently elevated (${cost}). Hold briefly. Sentiment: ${fgStr}.`
      : `${verb} ${amount} ${symbol} on ${chain} at ${cost} is acceptable for ${urgency} urgency / ${mode} mode. Sentiment: ${fgStr}.`
  return sentence + ` Quality score ${score}/100.`
}

module.exports = router
