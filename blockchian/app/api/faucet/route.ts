import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, amount = 100 } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Thiếu địa chỉ ví nhận (walletAddress)." },
        { status: 400 }
      );
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { success: false, error: "Địa chỉ ví Solana không hợp lệ." },
        { status: 400 }
      );
    }

    const keypairPath = path.join(process.cwd(), "scripts", "keys", "mint-authority.json");
    const mintConfigPath = path.join(process.cwd(), "scripts", "mock-usdc-mint.json");

    if (!fs.existsSync(keypairPath) || !fs.existsSync(mintConfigPath)) {
      return NextResponse.json(
        { success: false, error: "Chưa cấu hình Mint Authority hoặc Token Mint trên máy chủ." },
        { status: 500 }
      );
    }

    const authoritySecret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const authorityKeypair = Keypair.fromSecretKey(new Uint8Array(authoritySecret));

    const mintConfig = JSON.parse(fs.readFileSync(mintConfigPath, "utf-8"));
    const mintPubkey = new PublicKey(mintConfig.mintAddress);

    const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
    const connection = new Connection(rpcUrl, "confirmed");

    // Lấy hoặc tạo ATA cho ví nhận
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityKeypair,
      mintPubkey,
      recipientPubkey
    );

    // 6 decimals
    const rawAmount = BigInt(Math.round(amount * 1_000_000));

    // Thực hiện mint
    const txSig = await mintTo(
      connection,
      authorityKeypair,
      mintPubkey,
      recipientAta.address,
      authorityKeypair,
      rawAmount
    );

    return NextResponse.json({
      success: true,
      data: {
        mint: mintConfig.mintAddress,
        recipient: walletAddress,
        ata: recipientAta.address.toBase58(),
        amount,
        txSignature: txSig,
        explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      },
      message: `Đã cấp thành công ${amount} Mock USDC vào ví của bạn trên Solana Devnet!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi server khi faucet token.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
