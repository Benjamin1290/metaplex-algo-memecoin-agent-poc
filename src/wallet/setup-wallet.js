/**
 * setup-wallet.js
 *
 * Generates a fresh Solana keypair, saves it to .env, and airdrops 2 devnet SOL.
 *
 * Usage: npm run setup
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { writeFileSync, existsSync } from 'fs';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const AIRDROP_SOL = 2;

console.log('\n' + '═'.repeat(60));
console.log('  WALLET SETUP');
console.log('  Generates a keypair and funds it with devnet SOL so the');
console.log('  minting scripts have a payer account ready to go.');
console.log('═'.repeat(60));

// Safety check: warn before overwriting an existing wallet
if (existsSync('.env')) {
  console.warn('\nA .env file already exists!');
  console.warn('   If you continue, the existing wallet will be overwritten.');
  console.warn('   Ctrl+C to cancel, or press Enter to continue.');

  await new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (key) => {
      if (key[0] === 3) {
        console.log('\nCancelled.');
        process.exit(0);
      }
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

console.log('\nGenerating a new Solana keypair...');
const keypair = Keypair.generate();
const privateKeyBase58 = bs58.encode(keypair.secretKey);
const publicKey = keypair.publicKey.toBase58();

writeFileSync('.env', `SOLANA_PRIVATE_KEY=${privateKeyBase58}\n`);
console.log(`Keypair saved to .env`);
console.log(`   Public Key: ${publicKey}`);

console.log(`\nConnecting to Solana devnet...`);
const connection = new Connection(DEVNET_RPC, 'confirmed');

console.log(`Requesting ${AIRDROP_SOL} SOL airdrop...`);
console.log(`   (Devnet faucet has rate limits — if this fails, wait a minute and try again)`);

let signature;
try {
  signature = await connection.requestAirdrop(
    keypair.publicKey,
    AIRDROP_SOL * LAMPORTS_PER_SOL
  );
} catch (err) {
  console.error('Airdrop request failed:', err.message);
  console.error('   Devnet faucet can be rate-limited. Try again in 60 seconds.');
  console.error('   Alternative: Visit https://faucet.solana.com and paste your public key.');
  process.exit(1);
}

console.log('Waiting for airdrop confirmation...');
try {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
} catch (err) {
  console.error('Could not confirm airdrop transaction:', err.message);
  console.error('   The airdrop may still succeed — check the explorer link below.');
}

const balance = await connection.getBalance(keypair.publicKey);

console.log('\n' + '═'.repeat(60));
console.log('Wallet ready');
console.log('═'.repeat(60));
console.log(`   Public Key : ${publicKey}`);
console.log(`   Balance    : ${balance / LAMPORTS_PER_SOL} SOL`);
console.log(`   Explorer   : https://explorer.solana.com/address/${publicKey}?cluster=devnet`);
console.log(`   Airdrop Tx : https://explorer.solana.com/tx/${signature}?cluster=devnet`);
console.log('═'.repeat(60));
console.log('\nNext step: npm run dev');
