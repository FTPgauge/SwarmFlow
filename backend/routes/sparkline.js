const { dataApi } = require('@surf-ai/sdk/server')
const { Router } = require('express')
const router = Router()

router.get('/', async (req, res) => {
  try {
    const symbol = (req.query.symbol || 'ETH').toUpperCase()
    const time_range = req.query.time_range || '1d'
    const r = await dataApi.market.price({ symbol, time_range })
    const points = (r?.data || []).map((p) => ({ t: p.timestamp, v: p.value }))
    res.json({ symbol, points, ts: Date.now() })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
