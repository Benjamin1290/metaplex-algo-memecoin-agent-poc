/**
 * trend-scanner.js
 *
 * Pulls trending topics from CoinGecko + Reddit, feeds them to GPT-4o,
 * and generates token concepts written to data/tokens.json.
 *
 * Usage:
 *   node src/agent/trend-scanner.js        => generates 3 token concepts (default)
 *   node src/agent/trend-scanner.js 5      => generates 5 token concepts
 */

import 'dotenv/config';
import axios from 'axios';
import OpenAI from 'openai';
import { writeFileSync } from 'fs';

const COUNT = parseInt(process.argv[2] ?? '3', 10);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('\n' + '═'.repeat(60));
console.log('OPENCLAW TREND SCANNER');
console.log('Fetching trends → GPT-4o → token concepts');
console.log('═'.repeat(60));

// Step 1: Fetch CoinGecko trending coins
console.log('\n[1/3] Fetching CoinGecko trending coins...');
let coinGeckoTrends = [];
try {
  const { data } = await axios.get('https://api.coingecko.com/api/v3/search/trending');
  coinGeckoTrends = data.coins.slice(0, 7).map(c => ({
    name: c.item.name,
    symbol: c.item.symbol,
    marketCapRank: c.item.market_cap_rank,
  }));
  console.log(`   Found ${coinGeckoTrends.length} trending coins:`);
  coinGeckoTrends.forEach(c => console.log(`   • ${c.name} (${c.symbol})`));
} catch (err) {
  console.warn('   CoinGecko fetch failed:', err.message);
}

// Step 2: Fetch Reddit r/CryptoCurrency hot posts
console.log('\n[2/3] Fetching Reddit r/CryptoCurrency hot posts...');
let redditTrends = [];
try {
  const { data } = await axios.get(
    'https://www.reddit.com/r/CryptoCurrency/hot.json?limit=10',
    { headers: { 'User-Agent': 'OpenClawTrendScanner/1.0' } }
  );
  redditTrends = data.data.children
    .map(p => p.data.title)
    .filter(t => t.length < 200);
  console.log(`   Found ${redditTrends.length} hot posts`);
  redditTrends.slice(0, 3).forEach(t => console.log(`   • ${t.slice(0, 80)}...`));
} catch (err) {
  console.warn('   Reddit fetch failed:', err.message);
}

// Step 3: Feed trends to GPT-4o and generate token concepts
console.log(`\n[3/3] Generating ${COUNT} token concepts with GPT-4o...`);

const trendsContext = [
  coinGeckoTrends.length > 0
    ? `Trending coins on CoinGecko right now:\n${coinGeckoTrends.map(c => `- ${c.name} (${c.symbol})`).join('\n')}`
    : '',
  redditTrends.length > 0
    ? `Hot topics on r/CryptoCurrency right now:\n${redditTrends.map(t => `- ${t}`).join('\n')}`
    : '',
].filter(Boolean).join('\n\n');

const prompt = `You are a creative memecoin concept generator for the Solana blockchain.

Based on these real crypto trends happening right now:

${trendsContext}

Generate exactly ${COUNT} unique and creative memecoin concepts inspired by these trends. Each concept should be fun, culturally relevant, and have strong meme potential.

Return a JSON array with exactly ${COUNT} objects. Each object must have:
- "name": catchy token name (max 20 chars)
- "symbol": 3-5 uppercase letters
- "description": fun memecoin description (max 200 chars, no words like "rug pull", "scam", "hack", "exploit", "illegal")
- "imagePrompt": detailed DALL-E image prompt for a vibrant mascot/logo (no text in image)

Return ONLY the raw JSON array, no markdown, no explanation.`;

let tokens = [];
try {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  });

  const raw = response.choices[0].message.content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  tokens = JSON.parse(raw);

  console.log(`\n   Generated ${tokens.length} token concepts:`);
  tokens.forEach((t, i) => console.log(`   [${i}] ${t.name} (${t.symbol}) — ${t.description.slice(0, 60)}...`));
} catch (err) {
  console.error('GPT-4o generation failed:', err.message);
  process.exit(1);
}

// Write to tokens.json
writeFileSync('./data/tokens.json', JSON.stringify(tokens, null, 2));

console.log('\n' + '═'.repeat(60));
console.log(`${tokens.length} token concepts saved to data/tokens.json`);
console.log('Next step: npm run mint-all');
console.log('═'.repeat(60) + '\n');
