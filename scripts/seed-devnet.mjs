/**
 * Seed script: creates REAL Solana devnet transactions for a target wallet.
 * Usage: node scripts/seed-devnet.mjs [wallet_address]
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const TARGET_WALLET = process.argv[2] || "CZ1ov4USvWsab5zN8fKSHJGB3qT1hPu76yaYjhJuHLMy";
const RPC = "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");

async function airdrop(pubkey, sol) {
  console.log(`  Airdropping ${sol} SOL to ${pubkey.toBase58().slice(0, 8)}...`);
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

async function transfer(from, to, sol, memo) {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: Math.round(sol * LAMPORTS_PER_SOL),
    })
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [from]);
  console.log(`  ✅ Transferred ${sol} SOL → ${to.toBase58().slice(0, 8)}... | ${memo} | sig: ${sig.slice(0, 20)}...`);
  return sig;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n🎯 Target wallet: ${TARGET_WALLET}`);
  console.log(`🌐 Network: Solana Devnet\n`);

  const targetPubkey = new PublicKey(TARGET_WALLET);

  // Create temporary "trading" keypairs to simulate different counterparties
  const trader = Keypair.generate();
  const counterparty1 = Keypair.generate();
  const counterparty2 = Keypair.generate();

  console.log("Step 1: Airdropping SOL to temp wallets...");
  try {
    await airdrop(trader.publicKey, 2);
    await sleep(1000);
    await airdrop(counterparty1.publicKey, 2);
    await sleep(1000);
    await airdrop(counterparty2.publicKey, 2);
    await sleep(1000);
  } catch (e) {
    console.error("❌ Airdrop failed (rate limited?). Try again in a few minutes.");
    console.error("   Or visit https://faucet.solana.com to manually airdrop.");
    process.exit(1);
  }

  // Also airdrop to target wallet so it has SOL
  console.log("\nStep 2: Airdropping SOL to your wallet...");
  try {
    await airdrop(targetPubkey, 2);
    await sleep(1000);
  } catch (e) {
    console.log("  ⚠️  Airdrop to target failed, continuing...");
  }

  console.log("\nStep 3: Creating trading-like transactions...\n");

  // Simulate trades: sends from counterparties TO target wallet (simulating profits)
  // and from trader TO target (simulating settlements)
  const trades = [
    { from: counterparty1, amount: 0.15, memo: "Trade 1: SOL-PERP long profit" },
    { from: counterparty2, amount: 0.08, memo: "Trade 2: ETH-PERP short profit" },
    { from: trader, amount: 0.22, memo: "Trade 3: BTC-PERP long profit" },
    { from: counterparty1, amount: 0.05, memo: "Trade 4: SOL-PERP scalp" },
    { from: counterparty2, amount: 0.31, memo: "Trade 5: ETH-PERP swing" },
    { from: trader, amount: 0.12, memo: "Trade 6: BTC-PERP short" },
    { from: counterparty1, amount: 0.18, memo: "Trade 7: SOL-PERP long" },
    { from: counterparty2, amount: 0.09, memo: "Trade 8: ETH-PERP scalp" },
    { from: trader, amount: 0.25, memo: "Trade 9: BTC-PERP swing profit" },
    { from: counterparty1, amount: 0.07, memo: "Trade 10: SOL-PERP quick trade" },
  ];

  const signatures = [];
  for (const t of trades) {
    try {
      const sig = await transfer(t.from, targetPubkey, t.amount, t.memo);
      signatures.push(sig);
      await sleep(500);
    } catch (e) {
      console.error(`  ❌ Failed: ${t.memo} — ${e.message}`);
    }
  }

  console.log(`\n✅ Done! Created ${signatures.length} real devnet transactions.`);
  console.log(`\n📋 Your wallet now has transaction history on devnet.`);
  console.log(`🔗 View: https://explorer.solana.com/address/${TARGET_WALLET}?cluster=devnet`);
  console.log(`\n🚀 Now connect your Phantom wallet (set to devnet) in the app to see real data!\n`);
}

main().catch(console.error);
