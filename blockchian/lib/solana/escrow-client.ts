import { PublicKey } from "@solana/web3.js";
import IDL from "./edulink_escrow.json";

export const ESCROW_IDL = IDL;

export const DEFAULT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ||
  "JC8zNCPiuxsCdrH7ffLxEvYX65PSWkGXSUt1rqMZ3KRQ"
);

/**
 * Tính toán Program Derived Address (PDA) của tài khoản Escrow
 */
export function getEscrowPda(
  employerPubkey: PublicKey,
  jobId: number | bigint,
  programId: PublicKey = DEFAULT_PROGRAM_ID
): [PublicKey, number] {
  const jobIdBuf = Buffer.alloc(8);
  jobIdBuf.writeBigUInt64LE(BigInt(jobId));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), employerPubkey.toBuffer(), jobIdBuf],
    programId
  );
}

/**
 * Tính toán Program Derived Address (PDA) của tài khoản Vault Token Account
 */
export function getVaultPda(
  escrowPda: PublicKey,
  programId: PublicKey = DEFAULT_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), escrowPda.toBuffer()],
    programId
  );
}

export enum EscrowStatus {
  Initialized = 0,
  Funded = 1,
  InProgress = 2,
  Completed = 3,
  Disputed = 4,
  Refunded = 5,
  Resolved = 6,
}

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  [EscrowStatus.Initialized]: "Đã khởi tạo",
  [EscrowStatus.Funded]: "Đã khóa tiền ký quỹ",
  [EscrowStatus.InProgress]: "Đang thực hiện",
  [EscrowStatus.Completed]: "Đã hoàn thành",
  [EscrowStatus.Disputed]: "Đang có tranh chấp",
  [EscrowStatus.Refunded]: "Đã hoàn tiền",
  [EscrowStatus.Resolved]: "Đã giải quyết tranh chấp",
};
