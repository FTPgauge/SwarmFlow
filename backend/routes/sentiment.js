const { dataApi } = require('@surf-ai/sdk/server')
const { Router } = require('express')
const router = Router()

router.get('/', async (_req, res) => {
  try {
    const r = await dataApi.market.fear_greed({})
    const data = r?.data || []
    const latest = data[0]
    res.json({ latest, history: data.slice(0, 30), ts: Date.now() })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
