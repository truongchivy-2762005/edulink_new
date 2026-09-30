import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYPAIR_PATH = path.join(__dirname, "keys", "mint-authority.json");
const MINT_CONFIG_PATH = path.join(__dirname, "mock-usdc-mint.json");

async function faucet() {
  const args = process.argv.slice(2);
  const recipientInput = args[0];
  const amountInput = parseFloat(args[1] || "100");

  if (!recipientInput) {
    console.log("❌ Thiếu địa chỉ ví nhận!");
    console.log("\n👉 CÁCH DÙNG:");
    console.log("   node scripts/faucet-usdc.mjs <ĐỊA_CHỈ_VÍ_SOLANA> [SỐ_LƯỢNG_USDC]");
    console.log("   Ví dụ: node scripts/faucet-usdc.mjs 7xKX...3b49 200\n");
    process.exit(1);
  }

  let recipientPubkey;
  try {
    recipientPubkey = new PublicKey(recipientInput);
  } catch {
    console.error("❌ Địa chỉ ví nhận không đúng định dạng Solana:", recipientInput);
    process.exit(1);
  }

  if (!fs.existsSync(KEYPAIR_PATH)) {
    console.error("❌ Không tìm thấy Mint Authority keypair tại:", KEYPAIR_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(MINT_CONFIG_PATH)) {
    console.error("❌ Chưa khởi tạo Token Mint! Vui lòng chạy 'node scripts/init-mock-usdc.mjs' trước.");
    process.exit(1);
  }

  const authoritySecret = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  const authorityKeypair = Keypair.fromSecretKey(new Uint8Array(authoritySecret));

  const mintConfig = JSON.parse(fs.readFileSync(MINT_CONFIG_PATH, "utf-8"));
  const mintPubkey = new PublicKey(mintConfig.mintAddress);

  const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  const connection = new Connection(RPC_URL, "confirmed");

  console.log("==================================================");
  console.log("💧 EDULINK HUB — FAUCET MOCK USDC (DEVNET)");
  console.log("==================================================");
  console.log("Token Mint:", mintConfig.mintAddress);
  console.log("Người nhận:", recipientPubkey.toBase58());
  console.log("Số lượng yêu cầu:", amountInput, "mUSDC");
  console.log("RPC:", RPC_URL);
  console.log("--------------------------------------------------");

  console.log("Đang kiểm tra / tạo Associated Token Account (ATA) cho ví nhận...");
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authorityKeypair, // Payer trả phí tạo ATA nếu chưa có
    mintPubkey,
    recipientPubkey
  );

  console.log("Associated Token Account (ATA):", recipientAta.address.toBase58());

  // 6 decimals: 1 USDC = 1,000,000 units
  const rawAmount = BigInt(Math.round(amountInput * 1_000_000));

  console.log(`Đang mint ${amountInput} Mock USDC vào ATA...`);
  const txSig = await mintTo(
    connection,
    authorityKeypair, // Payer
    mintPubkey,
    recipientAta.address,
    authorityKeypair, // Mint Authority
    rawAmount
  );

  console.log("\n🎉 MINT THÀNH CÔNG!");
  console.log("Mã giao dịch (Tx Signature):", txSig);
  console.log(`Kiểm tra trên Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
  console.log(`Kiểm tra số dư ví trên Explorer: https://explorer.solana.com/address/${recipientPubkey.toBase58()}?cluster=devnet`);
  console.log("==================================================\n");
}

faucet().catch((err) => {
  console.error("Lỗi Faucet Token:", err);
  process.exit(1);
});
