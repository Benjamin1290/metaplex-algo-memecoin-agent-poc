/**
 * register-agent.js
 *
 * Registers the OpenClaw memecoin agent on-chain via Metaplex Agent Registry.
 * Creates an MPL Core asset + Agent Identity PDA in a single transaction.
 *
 * Usage: npm run register
 */

import 'dotenv/config';
import { mintAndSubmitAgent, mplAgentIdentity } from '@metaplex-foundation/mpl-agent-registry';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import bs58 from 'bs58';
import { writeFileSync } from 'fs';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const IRYS_NODE = 'https://node1.irys.xyz';

console.log('\n' + '═'.repeat(60));
console.log('OPENCLAW — AGENT REGISTRATION');
console.log('Registers this agent on-chain via Metaplex Agent Registry');
console.log('═'.repeat(60));

if (!process.env.SOLANA_PRIVATE_KEY) {
  console.error('\nSOLANA_PRIVATE_KEY not found in .env');
  process.exit(1);
}

const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);

// Set up UMI with agent registry + Irys uploader
const umi = createUmi(MAINNET_RPC)
  .use(mplAgentIdentity())
  .use(irysUploader({ address: IRYS_NODE }));

const umiKeypair = umi.eddsa.createKeypairFromSecretKey(privateKeyBytes);
umi.use(keypairIdentity(umiKeypair));

console.log(`\nWallet: ${umi.identity.publicKey}`);

// Upload agent metadata JSON to Arweave for permanent storage
console.log('\nUploading agent metadata to Arweave...');

const agentMetadata = {
  type: 'agent',
  name: 'OpenClaw Memecoin Agent',
  description: 'Autonomous AI agent that scans crypto trends and launches memecoins on Solana via Metaplex Genesis.',
  image: 'https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc',
  services: [
    {
      name: 'trend-scan',
      endpoint: 'https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc',
    },
    {
      name: 'memecoin-launch',
      endpoint: 'https://github.com/Benjamin1290/metaplex-algo-memecoin-agent-poc',
    },
  ],
  registrations: [],
  supportedTrust: ['reputation'],
};

let metadataUri;
try {
  metadataUri = await umi.uploader.uploadJson(agentMetadata);
  console.log(`   Metadata URI: ${metadataUri}`);
} catch (err) {
  console.error('Metadata upload failed:', err.message);
  process.exit(1);
}

// Register agent on-chain
console.log('\nRegistering agent on-chain...');

let result;
try {
  result = await mintAndSubmitAgent(umi, {}, {
    wallet: umi.identity.publicKey,
    name: 'OpenClaw Memecoin Agent',
    uri: metadataUri,
    agentMetadata,
  });
} catch (err) {
  console.error('Agent registration failed:', err.message);
  process.exit(1);
}

// Save registration result
const registration = {
  agentName: 'OpenClaw Memecoin Agent',
  assetAddress: result.assetAddress,
  metadataUri,
  signature: result.signature,
  wallet: umi.identity.publicKey,
  network: 'mainnet',
  registeredAt: new Date().toISOString(),
};

writeFileSync('./data/agent-registration.json', JSON.stringify(registration, null, 2));

console.log('\n' + '═'.repeat(60));
console.log('AGENT REGISTERED ON-CHAIN');
console.log('═'.repeat(60));
console.log(`   Asset Address : ${result.assetAddress}`);
console.log(`   Explorer      : https://explorer.solana.com/address/${result.assetAddress}`);
console.log(`   Metadata URI  : ${metadataUri}`);
console.log(`   Saved to      : data/agent-registration.json`);
console.log('═'.repeat(60) + '\n');
