# SwarmFlow

AI-powered crypto execution + gas optimization assistant

> MVP build – early stage prototype

## Features

- 🔥 Gas optimization suggestions
- ⏱️ Execution timing recommendations
- 💼 Wallet tracking (basic)
- 📊 Live market feed (WIP)

## Built with

- Node.js + Express
- Drizzle ORM + PostgreSQL
- AI-assisted development

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FTPgauge/SwarmFlow.git
cd SwarmFlow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration (database URL, API keys, etc.)

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

- `schema.js` - Database schema definitions (Drizzle ORM)
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template

## License

MIT

## Status

This is an MVP (Minimum Viable Product) and is currently in early development stages.
