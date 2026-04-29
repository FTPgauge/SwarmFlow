const { dataApi } = require('@surf-ai/sdk/server')
const { Router } = require('express')
const router = Router()

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100)
    const sort = req.query.sort_by || 'market_cap'
    const r = await dataApi.market.ranking({ sort_by: sort, limit })
    res.json({ data: r?.data || [], ts: Date.now() })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
