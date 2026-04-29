const { pgTable, serial, text, timestamp, doublePrecision, integer, boolean, jsonb } = require('drizzle-orm/pg-core')

exports.watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  name: text('name'),
  chain: text('chain'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
})

exports.gas_alerts = pgTable('gas_alerts', {
  id: serial('id').primaryKey(),
  chain: text('chain').notNull(),
  threshold_gwei: doublePrecision('threshold_gwei').notNull(),
  enabled: boolean('enabled').default(true),
  triggered_count: integer('triggered_count').default(0),
  last_triggered_at: timestamp('last_triggered_at'),
  created_at: timestamp('created_at').defaultNow(),
})

exports.execution_log = pgTable('execution_log', {
  id: serial('id').primaryKey(),
  tx_type: text('tx_type').notNull(),
  symbol: text('symbol').notNull(),
  amount: doublePrecision('amount'),
  chain: text('chain').notNull(),
  urgency: text('urgency'),
  mode: text('mode'),
  recommendation: jsonb('recommendation'),
  quality_score: integer('quality_score'),
  created_at: timestamp('created_at').defaultNow(),
})
