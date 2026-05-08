import 'dotenv/config';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
const keypair = Keypair.fromSecretKey(privateKeyBytes);
const connection = new Connection(MAINNET_RPC, 'confirmed');
const balance = await connection.getBalance(keypair.publicKey);

console.log(`\nAddress : ${keypair.publicKey.toBase58()}`);
console.log(`Balance : ${balance / LAMPORTS_PER_SOL} SOL`);
console.log(`Explorer: https://explorer.solana.com/address/${keypair.publicKey.toBase58()}\n`);
