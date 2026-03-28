# Metaplex Grant Proposal
## OpenClaw Skill: `create_memecoin_from_trend`
### AI-Driven Autonomous Memecoin Creation on Solana via Metaplex

**Applicant:** Benjamin1290 (Benjii)
**GitHub:** https://github.com/Benjamin1290
**Date:** March 2026
**Requested Grant:** $12,000 USD equivalent

---

## Executive Summary

Memecoin creation on Solana is broken in one specific way: the human bottleneck. A trend erupts on X or TikTok, and by the time a founder spins up a wallet, designs an image, uploads metadata, and deploys a token, the moment has passed. The niche is captured by someone faster, or not at all.

This proposal describes **`create_memecoin_from_trend`**: an OpenClaw skill (AI agent action) that closes this loop entirely. The agent monitors social platforms for niche crypto meme signals, uses a language model to generate token concepts, calls an image generation API for art, uploads permanent metadata to Arweave via Irys, and calls Metaplex's Token Metadata program to launch the coin on Solana, all in under 60 seconds, without a human in the loop.

**Why Metaplex?** Metaplex is the on-chain standard for token metadata on Solana. Every serious token launcher uses it. By building this skill on top of Metaplex's stack (Token Metadata program, Irys uploader, and eventually Metaplex's memecoin mode with auto-LP) we make Metaplex the default infrastructure for the next generation of algorithmic token creation. Every autonomous agent that creates a memecoin becomes a Metaplex transaction. The volume flywheel benefits the entire Metaplex ecosystem.

---

## Architecture & Flow

The pipeline has five discrete stages. Each stage is decoupled and could be run by a separate AI agent, but for this PoC they run in sequence:

### Stage 1: Trend Discovery
The agent polls X (Twitter) and TikTok trend APIs for niche crypto signals. The skill targets micro-trends (a meme format, a specific animal, a recent news peg) rather than broad categories. A fine-tuned classifier scores each signal for memecoin potential: novelty, emotional resonance, and Solana community relevance.

### Stage 2: Concept Generation
A language model (Claude, GPT-4, or similar) receives the trend signal and outputs a structured token concept:
- `name`: catchy, brand-able, max 32 chars
- `symbol`: 3-5 letter ticker
- `description`: max 280 chars, fun and shareable
- `art_prompt`: text-to-image prompt for the token's visual

### Stage 3: Asset Creation
The art prompt is passed to an image generation API (DALL-E, Flux, or Stability). The resulting image is uploaded directly to Arweave. The final image URL becomes part of the Metaplex metadata JSON.

### Stage 4: On-Chain Launch via Metaplex
This is where this PoC focuses. The agent:
1. Loads a funded Solana devnet keypair
2. Constructs the Metaplex standard metadata JSON
3. Uploads it permanently to Arweave via the Irys devnet node
4. Calls `createFungible()` from `@metaplex-foundation/mpl-token-metadata` to create the mint and metadata account in a single transaction
5. Mints the initial supply of 1,000,000 tokens to the agent wallet

All metadata is permanently on-chain: the mint account, the Metaplex metadata account, and the Arweave URI with name/symbol/description/image.

### Stage 5: Post-Launch Monitoring
The agent logs the mint address, saves an explorer link, and in future versions can monitor on-chain activity: first buyers, price discovery, LP depth. This data feeds back into Stage 1 to inform future trend scoring.

---

## PoC Demonstration

The attached codebase (`metaplex-algo-memecoin-agent-poc`) demonstrates Stages 3–4 running end-to-end on Solana devnet. Three AI-generated memecoin concepts are created, their metadata uploaded to Arweave, and their mint accounts created on-chain.

### Token Concepts

| Token | Symbol | Mint Address | Explorer |
|---|---|---|---|
| MoonSloth | SLOTH | 3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6 | https://explorer.solana.com/address/3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6?cluster=devnet |
| GigaBrain | GBRAIN | EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP | https://explorer.solana.com/address/EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP?cluster=devnet |
| PumpGhost | GHOST | 3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT | https://explorer.solana.com/address/3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT?cluster=devnet |

### Terminal Output — `npm run dev` (full run)

```
════════════════════════════════════════════════════════════
  OPENCLAW ALGO MEMECOIN AGENT — FULL RUN
════════════════════════════════════════════════════════════

[1/2] Wallet already exists in .env — skipping setup

[2/2] Minting all tokens...


════════════════════════════════════════════════════════════
OPENCLAW ALGO AGENT — MINTING ALL TOKENS
════════════════════════════════════════════════════════════
Found 3 tokens to mint:
  [0] MoonSloth (SLOTH)
  [1] GigaBrain (GBRAIN)
  [2] PumpGhost (GHOST)

────────────────────────────────────────────────────────────
Starting token 1 of 3: MoonSloth
────────────────────────────────────────────────────────────

════════════════════════════════════════════════════════════
MINTING TOKEN [0]: MoonSloth (SLOTH)
════════════════════════════════════════════════════════════
   Description : The laziest memecoin on Solana. While degens FOMO and panic-...
   Image URL   : undefined

Setting up Metaplex UMI on devnet...
Wallet loaded: 9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF
   Explorer: https://explorer.solana.com/address/9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF?cluster=devnet

Funding Irys uploader with 0.02 SOL (devnet)...
Irys funded

Uploading image to Arweave...
   Image URI: https://gateway.irys.xyz/EDvBTLUJevuxwJVxENkcjDxjD1qTbGEpJ4WDgc8UtUW9

Uploading metadata JSON to Arweave...
   Metadata URI: https://gateway.irys.xyz/31vz89ei1GSAQCKmnsMVrnZpPwsfK4n45DwzCNZtPSgj

Creating on-chain token mint + metadata
   Mint address (token ID): 3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6
Token created
   Tx: https://explorer.solana.com/tx//JJb2WQK73gl/y95ITorYYZmg/BdelKeXimVqvkO0RLx9Obe0UdNXZXgNraWhQ3WLZbaUYwWI2vbk9M9L37IBw==?cluster=devnet

Minting 1,000,000 SLOTH to your wallet...
Minted
   Tx: https://explorer.solana.com/tx/62L1KCBnAHCdutaNicx9nbhR5G8fm1nGQnafRjHjsrqTAPrTB1TgmFtenGTB4Sf9y3fQ3ZEEpUjKU1pTRBp4YEKz?cluster=devnet

════════════════════════════════════════════════════════════
MoonSloth (SLOTH) is LIVE on Solana devnet
════════════════════════════════════════════════════════════
   Mint Address : 3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6
   Explorer     : https://explorer.solana.com/address/3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6?cluster=devnet
   Metadata URI : https://gateway.irys.xyz/31vz89ei1GSAQCKmnsMVrnZpPwsfK4n45DwzCNZtPSgj
   Supply       : 1,000,000 SLOTH
   Results saved to data/results.json
════════════════════════════════════════════════════════════


────────────────────────────────────────────────────────────
Starting token 2 of 3: GigaBrain
────────────────────────────────────────────────────────────

════════════════════════════════════════════════════════════
MINTING TOKEN [1]: GigaBrain (GBRAIN)
════════════════════════════════════════════════════════════
   Description : Born from the collective intelligence of 10,000 crypto Twitt...
   Image URL   : undefined

Setting up Metaplex UMI on devnet...
Wallet loaded: 9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF
   Explorer: https://explorer.solana.com/address/9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF?cluster=devnet

Funding Irys uploader with 0.02 SOL (devnet)...
Irys funded

Uploading image to Arweave...
   Image URI: https://gateway.irys.xyz/39j42DFNambatdxSvGNM4PCB57PUWu6XC9KF8nmLyU89

Uploading metadata JSON to Arweave...
   Metadata URI: https://gateway.irys.xyz/2XHJFmQE5jBVKpfQTsMLDvWXEXFovdpU1a2RMQT6MxLN

Creating on-chain token mint + metadata
   Mint address (token ID): EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP
Token created
   Tx: https://explorer.solana.com/tx/kLK+187WhsJqVHIhoFg3RF5AdTkvrAo7lyv3r/PYfsx/5mRlwVbMNu+P9e3yN9lAIM49dWK0kikPgTcuJmHNDg==?cluster=devnet

Minting 1,000,000 GBRAIN to your wallet...
Minted
   Tx: https://explorer.solana.com/tx/nx2GQhFYBt8F4NTamCCveyPy3Bfoht61CqkFgVsq4BUWKhGzHfmFAkYTAjgYkD3hRRFbnrFdyXxo6YmKQi5gr2k?cluster=devnet

════════════════════════════════════════════════════════════
GigaBrain (GBRAIN) is LIVE on Solana devnet
════════════════════════════════════════════════════════════
   Mint Address : EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP
   Explorer     : https://explorer.solana.com/address/EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP?cluster=devnet
   Metadata URI : https://gateway.irys.xyz/2XHJFmQE5jBVKpfQTsMLDvWXEXFovdpU1a2RMQT6MxLN
   Supply       : 1,000,000 GBRAIN
   Results saved to data/results.json
════════════════════════════════════════════════════════════


────────────────────────────────────────────────────────────
Starting token 3 of 3: PumpGhost
────────────────────────────────────────────────────────────

════════════════════════════════════════════════════════════
MINTING TOKEN [2]: PumpGhost (GHOST)
════════════════════════════════════════════════════════════
   Description : Haunting Solana's mempool since the last bull run. PumpGhost...
   Image URL   : undefined

Setting up Metaplex UMI on devnet...
Wallet loaded: 9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF
   Explorer: https://explorer.solana.com/address/9VHbW4czZJzXuePFnwh4EaGoxTG4YKJdWAtNj1AFTvNF?cluster=devnet

Funding Irys uploader with 0.02 SOL (devnet)...
Irys funded

Uploading image to Arweave...
   Image URI: https://gateway.irys.xyz/7bqThLa6mmLCUPCpMRPQVUkGSWpkJwEeiBvgZaVw9gAq

Uploading metadata JSON to Arweave...
   Metadata URI: https://gateway.irys.xyz/oCpBDwajYmcCjzfYS6z9Kmm1RbTLdWvrJLfX3FfvVn8

Creating on-chain token mint + metadata
   Mint address (token ID): 3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT
Token created
   Tx: https://explorer.solana.com/tx/BzNPBkCChP7g0XyaUHXyXVVjhYBJhWM1gcGtwlwOIC3qe3nGhl3TBzN6SMqQLjUPApYkZ0NSjhfSvzMekgvsDA==?cluster=devnet

Minting 1,000,000 GHOST to your wallet...
Minted
   Tx: https://explorer.solana.com/tx/2PEayWrwZP1VwY7uy1rGPnPv2LM7NVTRmWR5WX7DXgRd5tXRHhEhvAmxJBsqcpz2emHgXdQWF7VxZ1VcJDsqs7MS?cluster=devnet

════════════════════════════════════════════════════════════
PumpGhost (GHOST) is LIVE on Solana devnet
════════════════════════════════════════════════════════════
   Mint Address : 3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT
   Explorer     : https://explorer.solana.com/address/3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT?cluster=devnet
   Metadata URI : https://gateway.irys.xyz/oCpBDwajYmcCjzfYS6z9Kmm1RbTLdWvrJLfX3FfvVn8
   Supply       : 1,000,000 GHOST
   Results saved to data/results.json
════════════════════════════════════════════════════════════


════════════════════════════════════════════════════════════
MINT-ALL SUMMARY
════════════════════════════════════════════════════════════

Successfully minted tokens:

  Token          | Symbol | Mint Address
  ─────────────────────────────────────────────────────────
  MoonSloth      | SLOTH  | 3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6
                            https://explorer.solana.com/address/3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6?cluster=devnet
  GigaBrain      | GBRAIN | EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP
                            https://explorer.solana.com/address/EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP?cluster=devnet
  PumpGhost      | GHOST  | 3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT
                            https://explorer.solana.com/address/3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT?cluster=devnet

Result: 3/3 tokens minted successfully on devnet
════════════════════════════════════════════════════════════
```

### Terminal Output — `data/results.json`

```
[
  {
    "index": 0,
    "name": "MoonSloth",
    "symbol": "SLOTH",
    "mintAddress": "3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6",
    "metadataUri": "https://gateway.irys.xyz/31vz89ei1GSAQCKmnsMVrnZpPwsfK4n45DwzCNZtPSgj",
    "explorerUrl": "https://explorer.solana.com/address/3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6?cluster=devnet",
    "createTxSignature": "/JJb2WQK73gl/y95ITorYYZmg/BdelKeXimVqvkO0RLx9Obe0UdNXZXgNraWhQ3WLZbaUYwWI2vbk9M9L37IBw==",
    "mintTxSignature": "62L1KCBnAHCdutaNicx9nbhR5G8fm1nGQnafRjHjsrqTAPrTB1TgmFtenGTB4Sf9y3fQ3ZEEpUjKU1pTRBp4YEKz",
    "initialSupply": 1000000,
    "decimals": 6,
    "network": "devnet",
    "mintedAt": "2026-03-28T19:56:48.681Z"
  },
  {
    "index": 1,
    "name": "GigaBrain",
    "symbol": "GBRAIN",
    "mintAddress": "EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP",
    "metadataUri": "https://gateway.irys.xyz/2XHJFmQE5jBVKpfQTsMLDvWXEXFovdpU1a2RMQT6MxLN",
    "explorerUrl": "https://explorer.solana.com/address/EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP?cluster=devnet",
    "createTxSignature": "kLK+187WhsJqVHIhoFg3RF5AdTkvrAo7lyv3r/PYfsx/5mRlwVbMNu+P9e3yN9lAIM49dWK0kikPgTcuJmHNDg==",
    "mintTxSignature": "nx2GQhFYBt8F4NTamCCveyPy3Bfoht61CqkFgVsq4BUWKhGzHfmFAkYTAjgYkD3hRRFbnrFdyXxo6YmKQi5gr2k",
    "initialSupply": 1000000,
    "decimals": 6,
    "network": "devnet",
    "mintedAt": "2026-03-28T19:57:07.729Z"
  },
  {
    "index": 2,
    "name": "PumpGhost",
    "symbol": "GHOST",
    "mintAddress": "3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT",
    "metadataUri": "https://gateway.irys.xyz/oCpBDwajYmcCjzfYS6z9Kmm1RbTLdWvrJLfX3FfvVn8",
    "explorerUrl": "https://explorer.solana.com/address/3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT?cluster=devnet",
    "createTxSignature": "BzNPBkCChP7g0XyaUHXyXVVjhYBJhWM1gcGtwlwOIC3qe3nGhl3TBzN6SMqQLjUPApYkZ0NSjhfSvzMekgvsDA==",
    "mintTxSignature": "2PEayWrwZP1VwY7uy1rGPnPv2LM7NVTRmWR5WX7DXgRd5tXRHhEhvAmxJBsqcpz2emHgXdQWF7VxZ1VcJDsqs7MS",
    "initialSupply": 1000000,
    "decimals": 6,
    "network": "devnet",
    "mintedAt": "2026-03-28T19:57:53.870Z"
  }
]
```

---

## Cost Estimate & Grant Ask

**Total Ask: $12,000 USD equivalent**

| Line Item | Cost | Notes |
|---|---|---|
| Stage 1: Trend Discovery API + classifier | $2,000 | X API Pro tier + lightweight ML model |
| Stage 2: LLM integration + prompt engineering | $1,500 | API costs + fine-tuning experiments |
| Stage 3: Image generation pipeline | $1,500 | API costs + CDN hosting |
| Stage 4: Metaplex integration (this PoC, extended) | $2,500 | Mainnet testing, error handling, mint authority revocation |
| Stage 5: Post-launch monitoring dashboard | $2,000 | Simple web UI showing live devnet tokens |
| Infrastructure: RPC nodes, Irys mainnet, CI/CD | $1,500 | 6 months hosting |
| Open-source maintenance + docs | $1,000 | README, tutorials, example video |


---

## Milestones & Open-Source Plan

**Milestone 1: PoC Complete** *(this submission)*
- Working devnet scripts for wallet setup, metadata upload, and token minting
- 3 tokens live on devnet with Metaplex metadata
- Open-source MIT license, public GitHub repo

**Milestone 2: Full Pipeline (Stages 1-4)**
- X/TikTok trend scraper integrated
- Claude API generating token concepts from trend input
- Image generation integrated (Flux or DALL-E)
- End-to-end agent run: trend to on-chain token in under 60 seconds

**Milestone 3: Safeguards and Fair Launch Params**
- Mint authority revoked post-launch
- Metaplex memecoin mode params: auto-LP seeding, anti-snipe delay
- Anti-dump: time-locked LP using Meteora or Raydium CLMM

**Milestone 4: Production-Ready + Dashboard**
- Mainnet (Solana mainnet-beta) integration with full safeguards
- Simple web dashboard: live trend feed, token list, on-chain stats
- Published npm package: `openclaw-create-memecoin`
- Tutorial video + written walkthrough

**All code will be MIT licensed and published at:** `https://github.com/Benjamin1290/openclaw-create-memecoin`

---


