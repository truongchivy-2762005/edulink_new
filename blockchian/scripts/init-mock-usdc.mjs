import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYS_DIR = path.join(__dirname, "keys");
const KEYPAIR_PATH = path.join(KEYS_DIR, "mint-authority.json");
const MINT_CONFIG_PATH = path.join(__dirname, "mock-usdc-mint.json");

// Đảm bảo thư mục lưu khóa tồn tại
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

// 1. Tải hoặc tạo mới Keypair cho Mint Authority
let authorityKeypair;
if (fs.existsSync(KEYPAIR_PATH)) {
  const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  authorityKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  console.log("Đã tải Mint Authority từ file:", KEYPAIR_PATH);
} else {
  authorityKeypair = Keypair.generate();
  fs.writeFileSync(
    KEYPAIR_PATH,
    JSON.stringify(Array.from(authorityKeypair.secretKey)),
    "utf-8"
  );
  console.log("Đã tạo mới Mint Authority và lưu tại:", KEYPAIR_PATH);
}

const authorityPubkey = authorityKeypair.publicKey.toBase58();
console.log("--------------------------------------------------");
console.log("Địa chỉ ví Mint Authority:", authorityPubkey);
console.log("--------------------------------------------------");

// 2. Kết nối tới Solana Devnet
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
const connection = new Connection(RPC_URL, "confirmed");

async function main() {
  console.log(`Đang kiểm tra số dư SOL trên mạng Devnet (${RPC_URL})...`);
  let balance = await connection.getBalance(authorityKeypair.publicKey);
  console.log(`Số dư hiện tại: ${balance / LAMPORTS_PER_SOL} SOL`);

  // Nếu số dư < 0.02 SOL, thử xin airdrop
  if (balance < 0.02 * LAMPORTS_PER_SOL) {
    console.log("Số dư chưa đủ để tạo Token Mint (~0.002 SOL). Đang thử yêu cầu Airdrop 1 SOL từ Devnet...");
    try {
      const airdropSig = await connection.requestAirdrop(
        authorityKeypair.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      console.log("Chờ giao dịch airdrop xác nhận:", airdropSig);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: airdropSig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      balance = await connection.getBalance(authorityKeypair.publicKey);
      console.log(`Airdrop thành công! Số dư mới: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (airdropErr) {
      console.warn("⚠️ Airdrop tự động gặp lỗi (thường do RPC public bị giới hạn rate-limit):", airdropErr.message);
      console.log("\n👉 HƯỚNG DẪN:");
      console.log(`Vui lòng chuyển khoảng 0.05 - 0.1 SOL Devnet từ ví Phantom của bạn sang địa chỉ:`);
      console.log(`   >>> ${authorityPubkey} <<<`);
      console.log(`Sau đó chạy lại lệnh này: node scripts/init-mock-usdc.mjs\n`);
      if (balance < 0.005 * LAMPORTS_PER_SOL) {
        process.exit(1);
      }
    }
  }

  // 3. Kiểm tra xem đã có Token Mint trước đó chưa
  if (fs.existsSync(MINT_CONFIG_PATH)) {
    const existing = JSON.parse(fs.readFileSync(MINT_CONFIG_PATH, "utf-8"));
    console.log("Đã tìm thấy Token Mint đã tạo trước đó:", existing.mintAddress);
    console.log(`Xem trên Explorer: https://explorer.solana.com/address/${existing.mintAddress}?cluster=devnet`);
    return existing;
  }

  console.log("Đang khởi tạo SPL Token Mint (Mock USDC - 6 decimals) trên Devnet...");
  const mint = await createMint(
    connection,
    authorityKeypair,           // Payer trả phí khởi tạo
    authorityKeypair.publicKey, // Mint Authority
    authorityKeypair.publicKey, // Freeze Authority
    6                           // 6 Decimals (chuẩn USDC)
  );

  const mintAddress = mint.toBase58();
  console.log("\n==================================================");
  console.log("🎉 KHỞI TẠO MOCK USDC THÀNH CÔNG TRÊN DEVNET!");
  console.log("Token Mint Address:", mintAddress);
  console.log("Explorer:", `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`);
  console.log("Decimals: 6");
  console.log("Authority:", authorityPubkey);
  console.log("==================================================\n");

  const configData = {
    mintAddress,
    decimals: 6,
    authority: authorityPubkey,
    network: "devnet",
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(MINT_CONFIG_PATH, JSON.stringify(configData, null, 2), "utf-8");
  return configData;
}

main().catch((err) => {
  console.error("Lỗi khởi tạo Mock USDC:", err);
  process.exit(1);
});
