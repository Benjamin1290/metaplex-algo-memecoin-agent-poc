/**
 * import-wallet.js
 *
 * Derives a Solana keypair from a seed phrase (mnemonic) and saves
 * the private key to .env as SOLANA_PRIVATE_KEY.
 *
 * Usage:
 *   node src/wallet/import-wallet.js "word1 word2 word3 ... word12"
 *
 * The derivation path matches Phantom and most Solana browser wallets.
 * After running, check the printed public address matches the wallet
 * your client sent SOL to before doing anything else.
 */

import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.error('Usage: node src/wallet/import-wallet.js "your twelve or twenty four words here"');
  process.exit(1);
}

if (!validateMnemonic(mnemonic)) {
  console.error('Invalid seed phrase — check the words and try again.');
  process.exit(1);
}

// Standard Solana derivation path used by Phantom and most wallets
const DERIVATION_PATH = "m/44'/501'/0'/0'";

const seed = mnemonicToSeedSync(mnemonic);
const { key } = derivePath(DERIVATION_PATH, seed.toString('hex'));
const keypair = Keypair.fromSeed(key);
const privateKeyBase58 = bs58.encode(keypair.secretKey);

console.log('\n' + '═'.repeat(60));
console.log('WALLET IMPORTED');
console.log('═'.repeat(60));
console.log(`   Public address : ${keypair.publicKey.toBase58()}`);
console.log(`   Explorer       : https://explorer.solana.com/address/${keypair.publicKey.toBase58()}`);
console.log('═'.repeat(60));
console.log('\n⚠️  Verify the public address above matches the wallet');
console.log('   your client funded before continuing.\n');

// Write to .env
const envPath = '.env';
let envContents = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

if (envContents.includes('SOLANA_PRIVATE_KEY=')) {
  envContents = envContents.replace(/SOLANA_PRIVATE_KEY=.*/, `SOLANA_PRIVATE_KEY=${privateKeyBase58}`);
} else {
  envContents += `\nSOLANA_PRIVATE_KEY=${privateKeyBase58}\n`;
}

writeFileSync(envPath, envContents);
console.log('SOLANA_PRIVATE_KEY saved to .env');
console.log('═'.repeat(60) + '\n');
