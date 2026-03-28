# OpenClaw-Style Algo Memecoin Creator PoC for Metaplex App

> A proof-of-concept AI agent skill that scans crypto meme trends, generates token concepts, and autonomously launches memecoins on Solana devnet via the Metaplex Token Metadata program.

---

## Thesis

This PoC demonstrates `create_memecoin_from_trend` — an **OpenClaw skill** that closes the loop between social trend discovery and on-chain token creation. An AI agent monitors X/TikTok for niche crypto meme themes, generates a token concept (name, symbol, description, art prompt), uploads the metadata to Arweave via Irys, and calls Metaplex's token program to launch the coin on Solana devnet — all without human intervention. For grant reviewers: this is the "dumb pipes become smart pipes" thesis applied to meme finance. The bottleneck for memecoin creation today is the human in the loop; this skill removes it.

---

## Architecture Flow

```
1. Scan Trends
   └─ Agent monitors X/TikTok/Reddit for niche crypto meme signals
       (e.g. "sleepy bear market", "galaxy-brain alpha calls", "ghost pumps")

2. Generate Token Concept
   └─ AI outputs: name, symbol, description, art prompt → sends to image generator

3. Upload to Arweave
   └─ Token metadata JSON + image uploaded permanently via Irys → Arweave URI

4. Launch on Solana (devnet)
   └─ Metaplex createFungible() → on-chain mint + metadata account
   └─ mintV1() → 1,000,000 tokens minted to agent wallet

5. Post-Launch Monitoring
   └─ Agent logs mint address, screenshots explorer, tracks balance/treasury
```

---

## OpenClaw Skill: `create_memecoin_from_trend`

```json
{
  "skill": "create_memecoin_from_trend",
  "version": "0.1.0",
  "input": {
    "trend_signal": "string",
    "image_url": "string (pre-generated or passed from image-gen skill)"
  },
  "output": {
    "mint_address": "string",
    "explorer_url": "string",
    "metadata_uri": "string",
    "token_name": "string",
    "token_symbol": "string"
  },
  "network": "devnet"
}
```

---

## Safeguards

| Safeguard | Implementation |
|---|---|
| **Anti-Rug** | Disable mint authority after launch (`setAuthority` → null) |
| **Fair Launch** | Metaplex memecoin mode: auto-LP seeding, anti-snipe params |
| **Anti-Dump** | Future version: LP lock via Meteora or Raydium CLMM |
| **Transparency** | All metadata stored permanently on-chain via Metaplex + Arweave |
| **Devnet Only** | Hardcoded `https://api.devnet.solana.com` — no mainnet risk |

---

## Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- Git

### 1. Clone and install

```bash
git clone https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc
cd metaplex-algo-memecoin-agent-poc
npm install
```

### 2. Add your token images

Save your 3 token images to the `assets/` folder:
- `assets/token-0.jpg` — MoonSloth
- `assets/token-1.jpg` — GigaBrain
- `assets/token-2.jpg` — PumpGhost

### 3. Run everything in one command

```bash
npm run dev
```

This will automatically generate a wallet, airdrop 2 devnet SOL, upload images + metadata to Arweave, and mint all 3 tokens. Results are saved to `data/results.json`.

> Note: If the devnet faucet is rate-limited, visit https://faucet.solana.com, paste your public key, then run `npm run dev` again.

### Individual commands

```bash
npm run setup                  # wallet + airdrop only
node scripts/mint-token.js 0   # mint MoonSloth only
node scripts/mint-token.js 1   # mint GigaBrain only
node scripts/mint-token.js 2   # mint PumpGhost only
npm run mint-all               # mint all 3 tokens
```

---

## Live Devnet Tokens

| Token | Symbol | Mint Address | Explorer |
|---|---|---|---|
| MoonSloth | SLOTH | 3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6 | https://explorer.solana.com/address/3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6?cluster=devnet |
| GigaBrain | GBRAIN | EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP | https://explorer.solana.com/address/EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP?cluster=devnet |
| PumpGhost | GHOST | 3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT | https://explorer.solana.com/address/3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT?cluster=devnet |

---

## Project Structure

```
metaplex-algo-memecoin-agent-poc/
├── data/
│   ├── tokens.json       ← AI-generated token concepts
│   └── results.json      ← mint addresses (auto-generated)
├── scripts/
│   ├── setup-wallet.js   ← generate keypair + airdrop SOL
│   ├── mint-token.js     ← mint one token by index
│   └── mint-all.js       ← mint all tokens sequentially
├── docs/
│   └── grant-proposal.md ← Metaplex grant application
├── .env.example          ← env var template
└── package.json
```

---

## Tech Stack

- **Solana** — `@solana/web3.js` for RPC + keypair management
- **Metaplex UMI** — `@metaplex-foundation/umi` + `umi-bundle-defaults`
- **Token Metadata** — `@metaplex-foundation/mpl-token-metadata` for on-chain metadata
- **Arweave / Irys** — `@metaplex-foundation/umi-uploader-irys` for permanent metadata storage
- **Node.js 18+** with ESM (`"type": "module"`)

---

*Built for the Metaplex grant application. Everything runs on devnet — no real money involved.*
