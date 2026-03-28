/**
 * mint-all.js
 *
 * Runs mint-token.js for every token in data/tokens.json sequentially and prints a final summary table.
 *
 * Usage: node scripts/mint-all.js
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const tokens = JSON.parse(readFileSync('./data/tokens.json', 'utf-8'));

console.log('\n' + '═'.repeat(60));
console.log('OPENCLAW ALGO AGENT — MINTING ALL TOKENS');
console.log('═'.repeat(60));
console.log(`Found ${tokens.length} tokens to mint:`);
tokens.forEach((t, i) => console.log(`  [${i}] ${t.name} (${t.symbol})`));

// Mint each token one at a time
// (important to be sequential: each tx needs to confirm before next)

const failed = [];

for (let i = 0; i < tokens.length; i++) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Starting token ${i + 1} of ${tokens.length}: ${tokens[i].name}`);
  console.log('─'.repeat(60));

  try {
    // Run mint-token.js as a child process, inheriting stdio so that all console.log output is visible directly in this terminal
    execSync(`node scripts/mint-token.js ${i}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌ Failed to mint ${tokens[i].name}. Error logged above.`);
    failed.push({ index: i, name: tokens[i].name });
  }
}

// Summary

console.log('\n' + '═'.repeat(60));
console.log('MINT-ALL SUMMARY');
console.log('═'.repeat(60));

// Load results from file

let results = [];
if (existsSync('./data/results.json')) {
  results = JSON.parse(readFileSync('./data/results.json', 'utf-8'));
}

if (results.length > 0) {
  console.log('\nSuccessfully minted tokens:\n');
  console.log('  Token          | Symbol | Mint Address');
  console.log('  ─────────────────────────────────────────────────────────');
  results.forEach((r) => {
    const padded = r.name.padEnd(14);
    console.log(`  ${padded} | ${r.symbol.padEnd(6)} | ${r.mintAddress}`);
    console.log(`  ${' '.repeat(14)}   ${' '.repeat(6)}   ${r.explorerUrl}`);
  });
}

if (failed.length > 0) {
  console.log(`\nFailed tokens (${failed.length}):`);
  failed.forEach((f) => console.log(`  [${f.index}] ${f.name}`));
  console.log('\n   Tip: Run individual tokens with: node scripts/mint-token.js <index>');
}

const successCount = tokens.length - failed.length;
console.log(`\nResult: ${successCount}/${tokens.length} tokens minted successfully on devnet`);
console.log('═'.repeat(60) + '\n');
