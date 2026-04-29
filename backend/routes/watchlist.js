const { dbQuery } = require('@surf-ai/sdk/db')
const { Router } = require('express')
const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await dbQuery('SELECT * FROM watchlist ORDER BY created_at DESC LIMIT 50')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

router.post('/', async (req, res) => {
  try {
    const { symbol, name, chain, notes } = req.body || {}
    if (!symbol) return res.status(400).json({ error: 'symbol required' })
    const { rows } = await dbQuery(
      'INSERT INTO watchlist (symbol, name, chain, notes) VALUES ($1,$2,$3,$4) RETURNING *',
      [String(symbol).toUpperCase(), name || null, chain || null, notes || null]
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await dbQuery('DELETE FROM watchlist WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) })
  }
})

module.exports = router
