"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { useAuth } from "@/lib/auth";
import { studentApi } from "@/lib/student-client";
import { Wallet, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Loader2, Coins } from "lucide-react";

interface NonceResponse {
  nonce: string;
  message: string;
  expires_at: string;
}

interface ConnectResponse {
  wallet_address: string;
  verified: boolean;
}

interface FaucetResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    txSignature: string;
    amount: number;
    explorerUrl: string;
  };
}

export default function SolanaWalletConnect({
  onSuccess,
}: {
  onSuccess?: (address: string) => void;
}) {
  const { publicKey, signMessage, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isFauceting, setIsFauceting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const walletBase58 = publicKey ? publicKey.toBase58() : "";
  const isLinked = user?.walletAddress && user.walletAddress === walletBase58;

  const handleConnect = () => {
    setErrorMsg(null);
    setVisible(true);
  };

  const handleSignAndVerify = async () => {
    if (!publicKey || !signMessage) {
      setErrorMsg("Ví hiện tại không hỗ trợ ký thông điệp (Sign Message).");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Lấy nonce và nội dung thông điệp từ Backend
      const nonceData = await studentApi<NonceResponse>("/wallet/nonce", {
        method: "GET",
      });

      // 2. Chuyển thông điệp sang Uint8Array để ví ký
      const messageBytes = new TextEncoder().encode(nonceData.message);

      // 3. Yêu cầu ví (Phantom / Solflare) ký thông điệp
      const signatureBytes = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signatureBytes);

      // 4. Gửi chữ ký và địa chỉ ví lên Backend để xác thực bằng Ed25519
      await studentApi<ConnectResponse>("/wallet/connect", {
        method: "POST",
        body: {
          wallet_address: walletBase58,
          signature: signatureBase58,
          message: nonceData.message,
        },
      });

      setSuccessMsg("Xác thực quyền sở hữu ví thành công! Ví đã được liên kết với tài khoản.");
      if (onSuccess) {
        onSuccess(walletBase58);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xác thực ví thất bại hoặc người dùng đã hủy ký.";
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFaucet = async () => {
    if (!walletBase58) return;
    setIsFauceting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: walletBase58, amount: 100 }),
      });
      const data: FaucetResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Faucet thất bại.");
      }
      setSuccessMsg(`Đã nhận 100 Mock USDC thành công vào ví! (Tx: ${data.data?.txSignature.slice(0, 8)}...)`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi faucet token.");
    } finally {
      setIsFauceting(false);
    }
  };

  return (
    <div style={{
      padding: "16px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      marginTop: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Wallet size={18} color="var(--color-primary, #6366f1)" />
          <span style={{ fontWeight: 600, fontSize: "14px" }}>Ví Solana (Devnet)</span>
        </div>
        {connected && (
          <span style={{
            fontSize: "12px",
            padding: "2px 8px",
            borderRadius: "6px",
            background: isLinked ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
            color: isLinked ? "#4ade80" : "#facc15",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {isLinked ? (
              <>
                <ShieldCheck size={13} /> Đã liên kết & xác thực
              </>
            ) : (
              <>
                <AlertTriangle size={13} /> Chưa xác thực chữ ký
              </>
            )}
          </span>
        )}
      </div>

      {!connected ? (
        <div>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "12px" }}>
            Kết nối ví Solana (Phantom / Solflare) để nhận tiền thưởng milestone và nạp ký quỹ dự án.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <Wallet size={16} /> Kết nối ví Solana
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.2)",
            padding: "8px 12px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "13px",
          }}>
            <span style={{ fontFamily: "monospace" }}>
              {walletBase58.slice(0, 6)}...{walletBase58.slice(-6)}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <a
                href={`https://explorer.solana.com/address/${walletBase58}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center" }}
                title="Xem trên Solana Explorer"
              >
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={() => disconnect()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Ngắt kết nối
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {!isLinked && (
              <button
                type="button"
                onClick={handleSignAndVerify}
                disabled={isVerifying}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: isVerifying ? "not-allowed" : "pointer",
                }}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang ký & xác minh...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Ký xác thực ví
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleFaucet}
              disabled={isFauceting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                fontSize: "12px",
                cursor: isFauceting ? "not-allowed" : "pointer",
              }}
            >
              {isFauceting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Đang cấp token...
                </>
              ) : (
                <>
                  <Coins size={13} /> Nhận 100 Mock USDC (Faucet)
                </>
              )}
            </button>
          </div>

          {isLinked && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontSize: "12px", marginTop: "10px" }}>
              <CheckCircle2 size={14} /> Ví của bạn đã được xác minh thành công với Backend.
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{
          marginTop: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          fontSize: "12px",
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          marginTop: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          background: "rgba(34, 197, 94, 0.15)",
          color: "#4ade80",
          fontSize: "12px",
        }}>
          {successMsg}
        </div>
      )}
    </div>
  );
}
