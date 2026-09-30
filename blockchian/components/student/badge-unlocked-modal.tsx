"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface OCABadge {
  id: string;
  title: string;
  issuer: string;
  issued_at: string;
  skills: string[];
  credential_hash: string;
  description?: string;
}

interface BadgeUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: OCABadge | null;
  onViewProfile?: () => void;
}

export default function BadgeUnlockedModal({
  isOpen,
  onClose,
  badge,
  onViewProfile,
}: BadgeUnlockedModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !badge || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "24px",
          color: "#1e293b",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 14px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "10px",
            }}
          >
            SBT Credential Unlocked
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Chúc mừng! Bạn đã nhận Chứng nhận mới
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
            Open Campus Achievement (OCA) đã được xác minh on-chain
          </p>
        </div>

        {/* Credential Content Card */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>
            {badge.title}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
            Cấp bởi: <strong>{badge.issuer}</strong> • Ngày cấp: {badge.issued_at}
          </div>

          {badge.description && (
            <div style={{ fontSize: "13px", color: "#334155", marginBottom: "12px", lineHeight: 1.4 }}>
              {badge.description}
            </div>
          )}

          {/* Verified Skills */}
          {badge.skills && badge.skills.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                Kỹ năng đã xác thực:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {badge.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      borderRadius: "6px",
                      fontWeight: 500,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* On-Chain Hash */}
          <div style={{ fontSize: "11px", color: "#64748b", wordBreak: "break-all" }}>
            On-Chain Hash: <code style={{ color: "#2563eb", fontFamily: "monospace" }}>{badge.credential_hash}</code>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              if (onViewProfile) onViewProfile();
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Xem trong Hồ sơ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
