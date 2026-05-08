/**
 * mint-all.js
 *
 * Runs mint-token.js for every token in data/tokens.json sequentially,
 * then prints a final summary table.
 *
 * Usage: node src/agent/mint-all.js
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const tokens = JSON.parse(readFileSync('./data/tokens.json', 'utf-8'));

console.log('\n' + '═'.repeat(60));
console.log('OPENCLAW ALGO AGENT — MINTING ALL TOKENS');
console.log('Mints each token sequentially so transactions don\'t race.');
console.log('═'.repeat(60));
console.log(`Found ${tokens.length} tokens to mint:`);
tokens.forEach((t, i) => console.log(`  [${i}] ${t.name} (${t.symbol})`));

const failed = [];

for (let i = 0; i < tokens.length; i++) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Starting token ${i + 1} of ${tokens.length}: ${tokens[i].name}`);
  console.log('─'.repeat(60));

  try {
    execSync(`node src/mint/mint-token.js ${i}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\nFailed to mint ${tokens[i].name}. Error logged above.`);
    failed.push({ index: i, name: tokens[i].name });
  }
}

console.log('\n' + '═'.repeat(60));
console.log('MINT-ALL SUMMARY');
console.log('═'.repeat(60));

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
  console.log('\n   Tip: Run individual tokens with: node src/mint/mint-token.js <index>');
}

const successCount = tokens.length - failed.length;
console.log(`\nResult: ${successCount}/${tokens.length} tokens minted successfully on mainnet`);
console.log('═'.repeat(60) + '\n');
