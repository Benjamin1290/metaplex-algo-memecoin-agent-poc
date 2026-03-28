/**
 * mint-token.js
 *
 * Mints a single memecoin from data/tokens.json using Metaplex UMI
 *
 * What it does:
 * 1. Loads token metadata from data/tokens.json
 * 2. Connects to Solana devnet
 * 3. Uploads the token metadata JSON to Arweave via Irys devnet
 * 4. Creates the on-chain token mint + Metaplex metadata account
 * 5. Mints 1,000,000 tokens to your wallet
 * 6. Saves the mint address + explorer link to data/results.json
 *
 * Usage:
 *   node scripts/mint-token.js 0 => mint MoonSloth (index 0)
 *   node scripts/mint-token.js 1 => mint GigaBrain (index 1)
 *   node scripts/mint-token.js 2 => mint PumpGhost (index 2)
 */

import 'dotenv/config';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
  sol,
  createGenericFile,
} from '@metaplex-foundation/umi';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// CONSTANTS — DEVNET ONLY
const DEVNET_RPC = 'https://api.devnet.solana.com';
const IRYS_DEVNET_NODE = 'https://devnet.irys.xyz';
const INITIAL_SUPPLY = 1_000_000; // 1 million tokens
const TOKEN_DECIMALS = 6;          // like USDC — 6 decimal places
const IRYS_FUND_SOL = 0.02; // SOL to pre-fund Irys (covers image + metadata uploads)

// STEP 0: Parse CLI args and load token data
const tokenIndex = parseInt(process.argv[2] ?? '0', 10);

if (isNaN(tokenIndex)) {
  console.error('Usage: node scripts/mint-token.js <index>  (e.g. 0, 1, or 2)');
  process.exit(1);
}

const tokens = JSON.parse(readFileSync('./data/tokens.json', 'utf-8'));

if (tokenIndex < 0 || tokenIndex >= tokens.length) {
  console.error(`Token index ${tokenIndex} out of range. Valid values: 0 to ${tokens.length - 1}`);
  process.exit(1);
}

const token = tokens[tokenIndex];

console.log('\n' + '═'.repeat(60));
console.log(`MINTING TOKEN [${tokenIndex}]: ${token.name} (${token.symbol})`);
console.log('═'.repeat(60));
console.log(`   Description : ${token.description.slice(0, 60)}...`);
console.log(`   Image URL   : ${token.imageUrl}`);

// STEP 1: Validate .env and load private key
if (!process.env.SOLANA_PRIVATE_KEY) {
  console.error('\nSOLANA_PRIVATE_KEY not found in .env!');
  console.error('   Run this first: node scripts/setup-wallet.js');
  process.exit(1);
}

// Decode the base58 private key back into raw bytes
const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);

// STEP 2: Set up Metaplex UMI
console.log('\nSetting up Metaplex UMI on devnet...');

const umi = createUmi(DEVNET_RPC)
  .use(mplTokenMetadata())       // loads the Token Metadata program
  .use(irysUploader({ address: IRYS_DEVNET_NODE }));

// Create a UMI keypair from our raw private key bytes (UMI has its own keypair format separate from @solana/web3.js)
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(privateKeyBytes);
const signer = createSignerFromKeypair(umi, umiKeypair);

// Tell UMI to use this keypair for signing all transactions
umi.use(signerIdentity(signer));

console.log(`Wallet loaded: ${signer.publicKey}`);
console.log(`   Explorer: https://explorer.solana.com/address/${signer.publicKey}?cluster=devnet`);

// STEP 3: Fund the Irys uploader
//
// Irys stores metadata on Arweave (permanent decentralised storage)
// On devnet, you pay with devnet SOL (worthless test tokens)
// We pre-fund a small amount to cover the metadata JSON upload
console.log(`\nFunding Irys uploader with ${IRYS_FUND_SOL} SOL (devnet)...`);

try {
  await umi.uploader.fund(sol(IRYS_FUND_SOL));
  console.log('Irys funded');
} catch (err) {
  console.error('Could not fund Irys uploader:', err.message);
  console.error('   Make sure your wallet has SOL. Run: node scripts/setup-wallet.js');
  process.exit(1);
}

// STEP 4a: Read local image file and upload it to Arweave
//
// Images live in assets/ (token-0.jpg, token-1.jpg, token-2.jpg).
// Uploading to Arweave gives a permanent URL that wallets and
// Solana Explorer can always fetch without hotlink restrictions.
console.log(`\nUploading image to Arweave...`);

if (!token.localImagePath) {
  console.error('No localImagePath in tokens.json. Add "localImagePath": "assets/token-X.jpg"');
  process.exit(1);
}
if (!existsSync(token.localImagePath)) {
  console.error(`Image file not found: ${token.localImagePath}`);
  console.error(`Download your image from imgbb and save it to: ${token.localImagePath}`);
  process.exit(1);
}

let imageArweaveUri;
try {
  const imageBytes = new Uint8Array(readFileSync(token.localImagePath));
  const ext = token.localImagePath.split('.').pop().toLowerCase();
  const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  const imageFile = createGenericFile(imageBytes, `token-${tokenIndex}.${ext}`, { contentType });
  [imageArweaveUri] = await umi.uploader.upload([imageFile]);
  console.log(`   Image URI: ${imageArweaveUri}`);
} catch (err) {
  console.error('Image upload failed:', err.message);
  process.exit(1);
}

// STEP 4b: Upload token metadata JSON to Arweave
console.log(`\nUploading metadata JSON to Arweave...`);

const metadataJson = {
  name: token.name,
  symbol: token.symbol,
  description: token.description,
  image: imageArweaveUri,   // ← permanent Arweave URL, not imgbb
  attributes: [
    { trait_type: 'Type', value: 'Memecoin' },
    { trait_type: 'Network', value: 'Solana Devnet' },
    { trait_type: 'Creator', value: 'OpenClaw Algo Agent' },
  ],
  properties: {
    files: [{ uri: imageArweaveUri, type: 'image/jpeg' }],
    category: 'image',
  },
  extensions: {
    website: 'https://github.com/Benjamin1290',
  },
};

let metadataUri;
try {
  metadataUri = await umi.uploader.uploadJson(metadataJson);
  console.log(`   Metadata URI: ${metadataUri}`);
} catch (err) {
  console.error('Metadata upload failed:', err.message);
  process.exit(1);
}

// STEP 5: Create the token mint and Metaplex metadata account
//
// createFungible() does two things in one tx:
//   a) Creates a new SPL token mint account (the token's "ID")
//   b) Creates a Metaplex metadata account pointing to the URI
console.log(`\nCreating on-chain token mint + metadata`);

// generateSigner creates a fresh keypair that will be the mint address
const mint = generateSigner(umi);
console.log(`   Mint address (token ID): ${mint.publicKey}`);

let createTxSignature;
try {
  const { signature } = await createFungible(umi, {
    mint,                                    // the new mint account
    name: token.name,
    symbol: token.symbol,
    uri: metadataUri,                        // the Arweave URL we just uploaded
    sellerFeeBasisPoints: percentAmount(0),  // 0% royalty fee
    decimals: TOKEN_DECIMALS,
    isMutable: true,                         // allows metadata updates (disable post-launch in prod)
  }).sendAndConfirm(umi);

  createTxSignature = Buffer.from(signature).toString('base64');
  console.log(`Token created`);
  console.log(`   Tx: https://explorer.solana.com/tx/${createTxSignature}?cluster=devnet`);
} catch (err) {
  console.error('Token creation failed:', err.message);
  process.exit(1);
}

// STEP 6: Mint the initial supply to the wallet
//
// mintV1() mints tokens from the mint account to our wallet
// Total minted = INITIAL_SUPPLY * 10^TOKEN_DECIMALS (raw amount)
console.log(`\nMinting ${INITIAL_SUPPLY.toLocaleString()} ${token.symbol} to your wallet...`);

// Raw amount = human-readable amount × 10^decimals
// e.g. 1,000,000 tokens with 6 decimals = 1,000,000,000,000 raw
const rawSupply = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);

// Use @solana/spl-token directly — it correctly handles ATA creation
// and minting regardless of which SPL token program version is in use.
let mintTxSignature;
try {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  // Reconstruct a web3.js Keypair from our raw private key bytes
  const web3Keypair = Keypair.fromSecretKey(privateKeyBytes);
  const mintPublicKey = new PublicKey(mint.publicKey.toString());

  // Create the Associated Token Account (ATA) if it doesn't exist.
  // This is the wallet's "slot" for holding this specific token.
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    web3Keypair,           // payer
    mintPublicKey,         // which token
    web3Keypair.publicKey  // owner
  );

  // Mint the initial supply into that ATA
  mintTxSignature = await mintTo(
    connection,
    web3Keypair,           // payer
    mintPublicKey,         // which token
    tokenAccount.address,  // destination ATA
    web3Keypair,           // mint authority
    rawSupply
  );

  console.log(`Minted`);
  console.log(`   Tx: https://explorer.solana.com/tx/${mintTxSignature}?cluster=devnet`);
} catch (err) {
  console.error('Minting failed:', err.message);
  process.exit(1);
}

// STEP 7: Save results to data/results.json
const mintAddress = mint.publicKey.toString();
const explorerUrl = `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`;

const result = {
  index: tokenIndex,
  name: token.name,
  symbol: token.symbol,
  mintAddress,
  metadataUri,
  explorerUrl,
  createTxSignature,
  mintTxSignature,
  initialSupply: INITIAL_SUPPLY,
  decimals: TOKEN_DECIMALS,
  network: 'devnet',
  mintedAt: new Date().toISOString(),
};

// Merge with any existing results
let results = [];
if (existsSync('./data/results.json')) {
  results = JSON.parse(readFileSync('./data/results.json', 'utf-8'));
  results = results.filter((r) => r.index !== tokenIndex); // remove old entry for this index
}
results.push(result);
writeFileSync('./data/results.json', JSON.stringify(results, null, 2));

console.log('\n' + '═'.repeat(60));
console.log(`${token.name} (${token.symbol}) is LIVE on Solana devnet`);
console.log('═'.repeat(60));
console.log(`   Mint Address : ${mintAddress}`);
console.log(`   Explorer     : ${explorerUrl}`);
console.log(`   Metadata URI : ${metadataUri}`);
console.log(`   Supply       : ${INITIAL_SUPPLY.toLocaleString()} ${token.symbol}`);
console.log(`   Results saved to data/results.json`);
console.log('═'.repeat(60) + '\n');