const { dbQuery } = require('@surf-ai/sdk/db')
const { Router } = require('express')
const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await dbQuery('SELECT * FROM gas_alerts ORDER BY created_at DESC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

router.post('/', async (req, res) => {
  try {
    const { chain, threshold_gwei } = req.body || {}
    if (!chain || threshold_gwei == null) return res.status(400).json({ error: 'chain and threshold_gwei required' })
    const { rows } = await dbQuery(
      'INSERT INTO gas_alerts (chain, threshold_gwei) VALUES ($1,$2) RETURNING *',
      [chain, parseFloat(threshold_gwei)]
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await dbQuery('DELETE FROM gas_alerts WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
