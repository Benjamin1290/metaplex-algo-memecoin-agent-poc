/**
 * dev.js
 *
 * One-command runner: sets up wallet if needed, then mints all tokens.
 *
 * Usage: npm run dev
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

console.log('\n' + '═'.repeat(60));
console.log('  OPENCLAW ALGO MEMECOIN AGENT — FULL RUN');
console.log('  Orchestrates wallet setup and batch minting in one command.');
console.log('═'.repeat(60));

// Check if we already have a funded wallet
let needsSetup = true;

if (existsSync('.env')) {
  const envContents = readFileSync('.env', 'utf-8');
  if (envContents.includes('SOLANA_PRIVATE_KEY=') && !envContents.includes('SOLANA_PRIVATE_KEY=your_base58')) {
    needsSetup = false;
  }
}

if (needsSetup) {
  console.log('\n[1/2] No wallet found — running setup...\n');
  try {
    execSync('node src/wallet/setup-wallet.js', { stdio: 'inherit' });
  } catch {
    console.error('\nWallet setup failed. See error above.');
    process.exit(1);
  }
} else {
  console.log('\n[1/2] Wallet already exists in .env — skipping setup');
}

console.log('\n[2/2] Minting all tokens...\n');
try {
  execSync('node src/agent/mint-all.js', { stdio: 'inherit' });
} catch {
  console.error('\nMinting failed. See error above.');
  process.exit(1);
}
