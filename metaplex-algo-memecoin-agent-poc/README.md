# Metaplex Algo Memecoin Agent PoC

An autonomous agent that creates Solana memecoins end-to-end — no human required. It uploads token images and metadata permanently to Arweave via Irys, then calls Metaplex's Token Metadata program to launch a fully-formed SPL token on Solana devnet in under 60 seconds.

**Why this matters:** The bottleneck for memecoin creation today is the human in the loop. A trend erupts, and by the time someone spins up a wallet, designs art, uploads metadata, and deploys — the moment has passed. This PoC removes that bottleneck entirely.

---

## What it does

1. Reads token concepts from `data/tokens.json`
2. Uploads each token image to Arweave (permanent, decentralised storage)
3. Uploads the metadata JSON (name, symbol, description, image URI) to Arweave
4. Calls `createFungible()` — creates the SPL mint account + Metaplex metadata account in one transaction
5. Mints 1,000,000 tokens to your wallet
6. Saves mint addresses and explorer links to `data/results.json`

---

## Quick start

```bash
git clone https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc
cd metaplex-algo-memecoin-agent-poc
npm install
npm run dev
```

`npm run dev` handles everything: generates a wallet, airdrops 2 devnet SOL, and mints all 3 tokens. If the devnet faucet is rate-limited, visit https://faucet.solana.com, paste your public key, then run `npm run dev` again.

**Individual commands:**

```bash
npm run setup                      # wallet + airdrop only
node src/mint/mint-token.js 0      # mint MoonSloth only
node src/mint/mint-token.js 1      # mint GigaBrain only
node src/mint/mint-token.js 2      # mint PumpGhost only
npm run mint-all                   # mint all 3 tokens
```

---

## Live devnet tokens

| Token | Symbol | Mint Address |
|---|---|---|
| MoonSloth | SLOTH | `3Que5JFEUaqTMJUHCMDQsAKAjWnRLHdfeqZBxRBbBNo6` |
| GigaBrain | GBRAIN | `EViDFFVn13WpUfAsyWah7ze77FCeoRyLU7BZM1uFPDdP` |
| PumpGhost | GHOST | `3YbA6yGrBg9dAtxrpZPvwBhFQvxjYzP84vjX8acyvCtT` |

---

## Project structure

```
src/
  agent/
    dev.js           ← orchestrator: setup + mint-all in one command
    mint-all.js      ← sequential batch minter
  mint/
    mint-token.js    ← mint a single token by index
  wallet/
    setup-wallet.js  ← generate keypair + airdrop devnet SOL
data/
  tokens.json        ← token concepts (name, symbol, description, image path)
  results.json       ← auto-generated: mint addresses, tx sigs, explorer links
assets/
  token-0.jpg        ← MoonSloth
  token-1.jpg        ← GigaBrain
  token-2.jpg        ← PumpGhost
docs/
  grant-proposal.md  ← Metaplex grant application
```

---

## Tech stack

- **Metaplex UMI** — `@metaplex-foundation/umi` + `umi-bundle-defaults`
- **Token Metadata** — `@metaplex-foundation/mpl-token-metadata`
- **Arweave / Irys** — `@metaplex-foundation/umi-uploader-irys`
- **Solana** — `@solana/web3.js` + `@solana/spl-token`
- Node.js 18+ with ESM

*Devnet only — no real money involved.*
