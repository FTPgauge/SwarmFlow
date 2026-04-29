const { dataApi } = require('@surf-ai/sdk/server')
const { Router } = require('express')
const router = Router()

router.get('/', async (req, res) => {
  try {
    const time_range = req.query.time_range || '7d'
    const limit = Math.min(parseInt(req.query.limit) || 12, 50)
    const r = await dataApi.onchain.bridge_ranking({ time_range, limit })
    res.json({ data: r?.data || [], ts: Date.now() })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
