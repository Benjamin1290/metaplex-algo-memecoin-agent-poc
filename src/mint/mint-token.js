/**
 * mint-token.js
 *
 * Mints a single memecoin from data/tokens.json using Metaplex UMI.
 *
 * What it does:
 * 1. Loads token metadata from data/tokens.json
 * 2. Generates token artwork via DALL-E (OPENAI_API_KEY in .env)
 * 3. Connects to Solana devnet
 * 4. Uploads the token image + metadata JSON to Arweave via Irys devnet
 * 5. Creates the on-chain token mint + Metaplex metadata account
 * 6. Mints 1,000,000 tokens to your wallet
 * 7. Saves the mint address + explorer link to data/results.json
 *
 * Usage:
 *   node src/mint/mint-token.js 0  =>  mint MoonSloth
 *   node src/mint/mint-token.js 1  =>  mint GigaBrain
 *   node src/mint/mint-token.js 2  =>  mint PumpGhost
 */

import 'dotenv/config';
import OpenAI from 'openai';
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
import { writeFileSync, existsSync, readFileSync } from 'fs';

// CONSTANTS — DEVNET ONLY
const DEVNET_RPC = 'https://api.devnet.solana.com';
const IRYS_DEVNET_NODE = 'https://devnet.irys.xyz';
const INITIAL_SUPPLY = 1_000_000;
const TOKEN_DECIMALS = 6;
const IRYS_FUND_SOL = 0.02;

// Parse CLI args and load token data
const tokenIndex = parseInt(process.argv[2] ?? '0', 10);

if (isNaN(tokenIndex)) {
  console.error('Usage: node src/mint/mint-token.js <index>  (e.g. 0, 1, or 2)');
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
console.log('Uploads image + metadata to Arweave, creates SPL mint, attaches Metaplex metadata on-chain.');
console.log('═'.repeat(60));
console.log(`   Description : ${token.description.slice(0, 60)}...`);

// Validate .env and load private key
if (!process.env.SOLANA_PRIVATE_KEY) {
  console.error('\nSOLANA_PRIVATE_KEY not found in .env!');
  console.error('   Run this first: node src/wallet/setup-wallet.js');
  process.exit(1);
}

const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);

// Set up Metaplex UMI
console.log('\nSetting up Metaplex UMI on devnet...');

const umi = createUmi(DEVNET_RPC)
  .use(mplTokenMetadata())
  .use(irysUploader({ address: IRYS_DEVNET_NODE }));

const umiKeypair = umi.eddsa.createKeypairFromSecretKey(privateKeyBytes);
const signer = createSignerFromKeypair(umi, umiKeypair);
umi.use(signerIdentity(signer));

console.log(`Wallet loaded: ${signer.publicKey}`);
console.log(`   Explorer: https://explorer.solana.com/address/${signer.publicKey}?cluster=devnet`);

// Fund the Irys uploader
// Irys stores metadata on Arweave (permanent decentralised storage).
// On devnet we pay with devnet SOL (worthless test tokens).
console.log(`\nFunding Irys uploader with ${IRYS_FUND_SOL} SOL (devnet)...`);

try {
  await umi.uploader.fund(sol(IRYS_FUND_SOL));
  console.log('Irys funded');
} catch (err) {
  console.error('Could not fund Irys uploader:', err.message);
  console.error('   Make sure your wallet has SOL. Run: node src/wallet/setup-wallet.js');
  process.exit(1);
}

// Generate image with DALL-E and upload to Arweave
console.log('\nGenerating image with DALL-E...');

if (!process.env.OPENAI_API_KEY) {
  console.error('\nOPENAI_API_KEY not found in .env!');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const imagePrompt = token.imagePrompt
  ?? `Vibrant crypto memecoin mascot for "${token.name}" (${token.symbol}). ${token.description} Bold colors, fun 2025 meme style, no text.`;

let imageArweaveUri;
try {
  const dalleResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  });

  const b64 = dalleResponse.data[0].b64_json;
  console.log('   Image generated');

  const imageBytes = new Uint8Array(Buffer.from(b64, 'base64'));
  const imageFile = createGenericFile(imageBytes, `token-${tokenIndex}.png`, { contentType: 'image/png' });
  [imageArweaveUri] = await umi.uploader.upload([imageFile]);
  console.log(`   Image URI: ${imageArweaveUri}`);
} catch (err) {
  console.error('Image generation/upload failed:', err.message);
  process.exit(1);
}

// Upload metadata JSON to Arweave
console.log('\nUploading metadata JSON to Arweave...');

const metadataJson = {
  name: token.name,
  symbol: token.symbol,
  description: token.description,
  image: imageArweaveUri,
  attributes: [
    { trait_type: 'Type', value: 'Memecoin' },
    { trait_type: 'Network', value: 'Solana Devnet' },
    { trait_type: 'Creator', value: 'OpenClaw Algo Agent' },
  ],
  properties: {
    files: [{ uri: imageArweaveUri, type: 'image/png' }],
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

// Create the token mint and Metaplex metadata account
// createFungible() does two things in one tx:
//   a) Creates a new SPL token mint account (the token's on-chain ID)
//   b) Creates a Metaplex metadata account pointing to the Arweave URI
console.log('\nCreating on-chain token mint + metadata...');

const mint = generateSigner(umi);
console.log(`   Mint address: ${mint.publicKey}`);

let createTxSignature;
try {
  const { signature } = await createFungible(umi, {
    mint,
    name: token.name,
    symbol: token.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: TOKEN_DECIMALS,
    isMutable: true,
  }).sendAndConfirm(umi);

  createTxSignature = Buffer.from(signature).toString('base64');
  console.log('Token created');
  console.log(`   Tx: https://explorer.solana.com/tx/${createTxSignature}?cluster=devnet`);
} catch (err) {
  console.error('Token creation failed:', err.message);
  process.exit(1);
}

// Mint initial supply to wallet
// Uses @solana/spl-token directly — it correctly handles ATA creation
// regardless of which SPL token program version is in use.
console.log(`\nMinting ${INITIAL_SUPPLY.toLocaleString()} ${token.symbol} to your wallet...`);

const rawSupply = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);

let mintTxSignature;
try {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const web3Keypair = Keypair.fromSecretKey(privateKeyBytes);
  const mintPublicKey = new PublicKey(mint.publicKey.toString());

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    web3Keypair,
    mintPublicKey,
    web3Keypair.publicKey
  );

  mintTxSignature = await mintTo(
    connection,
    web3Keypair,
    mintPublicKey,
    tokenAccount.address,
    web3Keypair,
    rawSupply
  );

  console.log('Minted');
  console.log(`   Tx: https://explorer.solana.com/tx/${mintTxSignature}?cluster=devnet`);
} catch (err) {
  console.error('Minting failed:', err.message);
  process.exit(1);
}

// Save results
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

let results = [];
if (existsSync('./data/results.json')) {
  results = JSON.parse(readFileSync('./data/results.json', 'utf-8'));
  results = results.filter((r) => r.index !== tokenIndex);
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
