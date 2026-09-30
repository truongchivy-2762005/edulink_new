import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import IDL from "./edulink_escrow.json";
import { DEFAULT_PROGRAM_ID, getEscrowPda, getVaultPda } from "./escrow-client";

export const MOCK_USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_MOCK_USDC_MINT ||
  "Co4758jcs8XiSMgfiGhsM278KBceNQwzmX2B9fERd7J7"
);

function getProgram(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Ví chưa được kết nối hoặc không hỗ trợ ký giao dịch.");
  }

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: "confirmed", preflightCommitment: "confirmed" }
  );

  return new Program(IDL as any, provider);
}

/**
 * 1. Doanh nghiệp nạp ký quỹ (Khởi tạo Escrow & Deposit Mock USDC) trên Solana Devnet
 */
export async function fundEscrowOnChain({
  jobId,
  totalBudgetUsdc,
  totalMilestones = 2,
  wallet,
  connection,
  arbitratorAddress,
}: {
  jobId: number;
  totalBudgetUsdc: number;
  totalMilestones?: number;
  wallet: WalletContextState;
  connection: Connection;
  arbitratorAddress?: string;
}): Promise<string> {
  const employerPubkey = wallet.publicKey;
  if (!employerPubkey) throw new Error("Chưa kết nối ví Doanh nghiệp.");

  const program = getProgram(connection, wallet);
  const [escrowPda] = getEscrowPda(employerPubkey, jobId);
  const [vaultPda] = getVaultPda(escrowPda);

  // Ví trọng tài: mặc định là Admin / deployer hoặc địa chỉ truyền vào
  const arbitrator = arbitratorAddress
    ? new PublicKey(arbitratorAddress)
    : employerPubkey;

  const employerAta = getAssociatedTokenAddressSync(MOCK_USDC_MINT, employerPubkey);
  const rawAmount = new BN(Math.round(totalBudgetUsdc * 1_000_000));

  // Kiểm tra xem EscrowAccount đã tồn tại trên on-chain chưa
  const escrowInfo = await connection.getAccountInfo(escrowPda);

  let txSignature: string;

  if (!escrowInfo) {
    // 1. Tạo Transaction gộp: Khởi tạo Escrow + Deposit
    console.log("Khởi tạo và nạp ký quỹ Escrow cho Job ID:", jobId);

    const initIx = await program.methods
      .initializeEscrow(new BN(jobId), rawAmount, totalMilestones)
      .accounts({
        employer: employerPubkey,
        arbitrator: arbitrator,
        mint: MOCK_USDC_MINT,
        escrowAccount: escrowPda,
        vault: vaultPda,
        systemProgram: PublicKey.default,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
      })
      .instruction();

    const depositIx = await program.methods
      .deposit(rawAmount)
      .accounts({
        employer: employerPubkey,
        employerTokenAccount: employerAta,
        escrowAccount: escrowPda,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(initIx, depositIx);
    txSignature = await wallet.sendTransaction(tx, connection);
  } else {
    // Escrow đã tồn tại, chỉ cần gọi deposit
    console.log("Escrow đã tồn tại, nạp thêm ký quỹ cho Job ID:", jobId);
    txSignature = await program.methods
      .deposit(rawAmount)
      .accounts({
        employer: employerPubkey,
        employerTokenAccount: employerAta,
        escrowAccount: escrowPda,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return txSignature;
}

/**
 * 2. Doanh nghiệp gán sinh viên nhận việc on-chain
 */
export async function assignStudentOnChain({
  jobId,
  studentWalletAddress,
  wallet,
  connection,
}: {
  jobId: number;
  studentWalletAddress: string;
  wallet: WalletContextState;
  connection: Connection;
}): Promise<string> {
  const employerPubkey = wallet.publicKey;
  if (!employerPubkey) throw new Error("Chưa kết nối ví.");

  const program = getProgram(connection, wallet);
  const [escrowPda] = getEscrowPda(employerPubkey, jobId);
  const studentPubkey = new PublicKey(studentWalletAddress);

  const txSignature = await program.methods
    .assignStudent(studentPubkey)
    .accounts({
      employer: employerPubkey,
      escrowAccount: escrowPda,
    })
    .rpc();

  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return txSignature;
}

/**
 * 3. Doanh nghiệp duyệt và giải ngân Milestone (Payout) cho sinh viên
 */
export async function payoutMilestoneOnChain({
  jobId,
  employerAddress,
  milestoneIndex,
  amountUsdc,
  studentWalletAddress,
  wallet,
  connection,
}: {
  jobId: number;
  employerAddress?: string;
  milestoneIndex: number;
  amountUsdc: number;
  studentWalletAddress: string;
  wallet: WalletContextState;
  connection: Connection;
}): Promise<string> {
  const authorityPubkey = wallet.publicKey;
  if (!authorityPubkey) throw new Error("Chưa kết nối ví.");

  const employerPubkey = employerAddress ? new PublicKey(employerAddress) : authorityPubkey;
  const studentPubkey = new PublicKey(studentWalletAddress);
  const program = getProgram(connection, wallet);

  const [escrowPda] = getEscrowPda(employerPubkey, jobId);
  const [vaultPda] = getVaultPda(escrowPda);

  const studentAta = getAssociatedTokenAddressSync(MOCK_USDC_MINT, studentPubkey);
  const rawAmount = new BN(Math.round(amountUsdc * 1_000_000));

  // Đảm bảo ATA của sinh viên đã được tạo
  const tx = new Transaction();
  const ataInfo = await connection.getAccountInfo(studentAta);
  if (!ataInfo) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        authorityPubkey,
        studentAta,
        studentPubkey,
        MOCK_USDC_MINT
      )
    );
  }

  const payoutIx = await program.methods
    .payoutMilestone(milestoneIndex, rawAmount)
    .accounts({
      authority: authorityPubkey,
      escrowAccount: escrowPda,
      vault: vaultPda,
      studentTokenAccount: studentAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  tx.add(payoutIx);

  const txSignature = await wallet.sendTransaction(tx, connection);
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return txSignature;
}

/**
 * 4. Phán quyết tranh chấp theo tỷ lệ (Dispute Resolution on-chain)
 */
export async function resolveDisputeOnChain({
  jobId,
  employerAddress,
  studentPercentage,
  studentWalletAddress,
  employerWalletAddress,
  wallet,
  connection,
}: {
  jobId: number;
  employerAddress: string;
  studentPercentage: number; // 0 - 100
  studentWalletAddress: string;
  employerWalletAddress: string;
  wallet: WalletContextState;
  connection: Connection;
}): Promise<string> {
  const arbitratorPubkey = wallet.publicKey;
  if (!arbitratorPubkey) throw new Error("Chưa kết nối ví Trọng tài / Admin.");

  const employerPubkey = new PublicKey(employerAddress);
  const studentPubkey = new PublicKey(studentWalletAddress);
  const program = getProgram(connection, wallet);

  const [escrowPda] = getEscrowPda(employerPubkey, jobId);
  const [vaultPda] = getVaultPda(escrowPda);

  const studentAta = getAssociatedTokenAddressSync(MOCK_USDC_MINT, studentPubkey);
  const employerAta = getAssociatedTokenAddressSync(MOCK_USDC_MINT, new PublicKey(employerWalletAddress));

  const studentSplitBps = Math.round(studentPercentage * 100);
  const employerSplitBps = 10000 - studentSplitBps;

  const tx = new Transaction();

  // Đảm bảo ATA cả 2 bên tồn tại
  const studentAtaInfo = await connection.getAccountInfo(studentAta);
  if (!studentAtaInfo) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        arbitratorPubkey,
        studentAta,
        studentPubkey,
        MOCK_USDC_MINT
      )
    );
  }

  const employerAtaInfo = await connection.getAccountInfo(employerAta);
  if (!employerAtaInfo) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        arbitratorPubkey,
        employerAta,
        new PublicKey(employerWalletAddress),
        MOCK_USDC_MINT
      )
    );
  }

  const disputeIx = await program.methods
    .resolveDispute(studentSplitBps, employerSplitBps)
    .accounts({
      arbitrator: arbitratorPubkey,
      escrowAccount: escrowPda,
      vault: vaultPda,
      studentTokenAccount: studentAta,
      employerTokenAccount: employerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  tx.add(disputeIx);

  const txSignature = await wallet.sendTransaction(tx, connection);
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return txSignature;
}
