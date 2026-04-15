# Metaplex Grant Proposal

## OpenClaw Skill: `create_memecoin_from_trend`

**Applicant:** Benjamin1290 (Benjii)
**GitHub:** https://github.com/Benjamin1290
**Date:** April 2026
**Requested Grant:** $12,000 USD equivalent in SOL

---

## What This Is

An AI-driven OpenClaw skill that scans live crypto trends (X, TikTok), generates a token concept (name, symbol, description, artwork), and launches it on Solana via Metaplex Genesis on metaplex.com. The skill is designed to be a reusable, open-source reference for the Metaplex agent library — fork-ready for any builder. A working PoC is already running: 3 tokens minted on devnet with full Metaplex metadata on Arweave.

---

## Milestones & Budget

| Milestone | Type | Description | Deliverables & Performance Metrics | Proposed Amount (USD equiv. in SOL) |
|---|---|---|---|---|
| 1 | Base + Performance | Coin recommendation engine + manual Genesis launches | • Trend scanner (X + TikTok)<br>• AI concept generation with reasoning<br>• 10+ tokens manually launched on metaplex.com via Genesis<br>• **Performance:** At least 5 tokens visible in the app + tracking sheet | $5,000 |
| 2 | Base + Performance | Full autonomous agent + Agent Kit integration | • Agent registered on-chain<br>• Automated end-to-end flow (trend → Genesis launch)<br>• Forkable reference for agent library<br>• **Performance:** Minimum 10 successful automated launches | $5,000 |
| 3 | Handover & Light Maintenance | One-time handover + basic maintenance | • Final documentation + video tutorial<br>• Public repo fully cleaned and ready for community forks<br>• 1 month of light updates / bug fixes only if critical issues arise<br>• **Performance:** At least 3 community forks or positive feedback | $2,000 |

**Total Grant: $12,000 USD equivalent in SOL**
**Payment structure:** Milestone-based upon review and approval of deliverables. Base deliverables unlock payment; performance metrics are verified before release.

---

## Current Status

- PoC already complete: 3 real devnet tokens minted + runnable prompt skill (see GitHub)
- Short demo video attached in previous message
- Ready to start Milestone 1 immediately

---

## PoC Evidence

| Token | Symbol | Mint Address | Explorer |
|---|---|---|---|
| MoonSloth | SLOTH | Cns5QxQTDj4DqS61K9DteuGWj55MWoTjDcvZjGXwmqa9 | [devnet](https://explorer.solana.com/address/Cns5QxQTDj4DqS61K9DteuGWj55MWoTjDcvZjGXwmqa9?cluster=devnet) |
| GigaBrain | GBRAIN | 9z1f9XnCNPpWi4KQWB8rjaDH7tnUGUa5qqpwLeBABww3 | [devnet](https://explorer.solana.com/address/9z1f9XnCNPpWi4KQWB8rjaDH7tnUGUa5qqpwLeBABww3?cluster=devnet) |
| PumpGhost | GHOST | Aa2u34gxSQj1WqAPdeGB3qs4EzbkzU8KSCSZUsXg1N6Y | [devnet](https://explorer.solana.com/address/Aa2u34gxSQj1WqAPdeGB3qs4EzbkzU8KSCSZUsXg1N6Y?cluster=devnet) |

---

## Links

- GitHub Repo: https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc
- Full technical details and terminal logs: in repo

All code is MIT licensed and built as a forkable reference for the Metaplex agent library.
