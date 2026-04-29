const { dataApi } = require('@surf-ai/sdk/server')
const { Router } = require('express')
const router = Router()

// Supported EVM chains by Surf onchain-gas-price.
// Solana isn't an EVM chain — we surface a fixed-fee model since Solana fees are
// effectively microcents and don't fluctuate the way EVM gas does.
const EVM_CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base']

// rough USD per native gas unit estimate for a standard transfer (~21k gas EVM)
const NATIVE_PRICE_FALLBACK = {
  ethereum: 2300,
  polygon: 0.22,
  bsc: 580,
  arbitrum: 2300,
  optimism: 2300,
  base: 2300,
  avalanche: 22,
}

router.get('/', async (_req, res) => {
  try {
    const results = await Promise.all(
      EVM_CHAINS.map(async (chain) => {
        try {
          const r = await dataApi.onchain.gas_price({ chain })
          return {
            chain,
            gas_price_gwei: r?.data?.gas_price_gwei ?? null,
            ok: true,
          }
        } catch (e) {
          return { chain, gas_price_gwei: null, ok: false, error: String(e?.message || e) }
        }
      })
    )

    // Estimate USD cost for a typical "transfer" (21k gas) and "swap" (180k gas)
    const enriched = results.map((r) => {
      const gwei = r.gas_price_gwei
      const nativeUsd = NATIVE_PRICE_FALLBACK[r.chain] || 0
      const transferUsd = gwei != null ? (gwei * 1e-9 * 21000 * nativeUsd) : null
      const swapUsd = gwei != null ? (gwei * 1e-9 * 180000 * nativeUsd) : null
      const bridgeUsd = gwei != null ? (gwei * 1e-9 * 250000 * nativeUsd) : null
      return { ...r, transfer_usd: transferUsd, swap_usd: swapUsd, bridge_usd: bridgeUsd }
    })

    // Solana synthetic entry — Solana fees are predictable & low, ~$0.00025 typical
    enriched.push({
      chain: 'solana',
      gas_price_gwei: null,
      ok: true,
      transfer_usd: 0.00025,
      swap_usd: 0.00075,
      bridge_usd: 0.005,
      synthetic: true,
    })

    res.json({ chains: enriched, ts: Date.now() })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
